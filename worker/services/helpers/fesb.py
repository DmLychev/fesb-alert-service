"""
Набор функций для выполнения http запросов к api FESB.
"""

import logging
import sys
import os
from datetime import datetime
import asyncio
import aiohttp
from aiohttp import ClientSession, ClientResponse
from .db import get_settings, save_issue
import re
from yarl import URL

logger = logging.getLogger('fesb')
_fesb_http_session: aiohttp.ClientSession | None = None

USER = os.getenv("FESB_API_USER", None)
PASSWORD = os.getenv("FESB_API_PASSWORD", None)
HOST = os.getenv("FESB_HOST", None)
PORT = int(os.getenv("FESB_PORT", 443 if HOST.lower().startswith('https') else 80))
MESSAGES_LOG_ENDPOINT = os.getenv("FESB_MESSAGE_LOG_ENDPOINT", None)
ERROR_MESSAGE_ENDPOINT = os.getenv("FESB_MESSAGE_ERROR_DETAILS_ENDPOINT", None)
FESB_TREAT_HTTP_AS_SECURE = os.getenv("FESB_TREAT_HTTP_AS_SECURE", "False").lower() in ['true', '1', 't', 'yes', 'on']

crit_msg = ''
if USER is None:
    crit_msg += "Не удалось получить значение переменной окружения FESB_API_USER. "
if PASSWORD is None:
    crit_msg += "Не удалось получить значение переменной окружения FESB_API_PASSWORD. "
if HOST is None or not HOST.lower().startswith('http'):
    crit_msg += "Некорректное значение переменной окружения FESB_HOST. "
if MESSAGES_LOG_ENDPOINT is None:
    crit_msg += "Не удалось получить значение переменной окружения FESB_MESSAGE_LOG_ENDPOINT. "
if ERROR_MESSAGE_ENDPOINT is None:
    crit_msg += "Не удалось получить значение переменной окружения ERROR_MESSAGE_ENDPOINT. "
if crit_msg:
    logger.critical(crit_msg)
    sys.exit(crit_msg)


async def init_fesb_client() -> None:
    global _fesb_http_session
    fesb_origin = URL(f"{HOST.rstrip('/')}:{PORT}").origin()
    cookie_jar_kwargs = {}

    if FESB_TREAT_HTTP_AS_SECURE:
        cookie_jar_kwargs["treat_as_secure_origin"] = fesb_origin

    cookie_jar = aiohttp.CookieJar(**cookie_jar_kwargs)
    _fesb_http_session = aiohttp.ClientSession(cookie_jar=cookie_jar)


def get_fesb_http_session() -> aiohttp.ClientSession:
    if _fesb_http_session is None or _fesb_http_session.closed:
        raise RuntimeError('FESB HTTP session is not initialized')

    return _fesb_http_session


async def close_fesb_client() -> None:
    global _fesb_http_session

    if _fesb_http_session is not None and not _fesb_http_session.closed:
        await _fesb_http_session.close()

    _fesb_http_session = None


class FesbRequestTimeoutError(Exception):
    """
    Превышено максимальное время ожидания ответа от FESB.
    """

    def __init__(self, message):
        super().__init__(message)
        self.message = message


async def _call_fesb(host: str, port: int, endpoint: str, user: str, password: str, payload: dict,
                     method: str = 'POST') -> ClientResponse:
    """
    Базовая функция отправки запроса в FESB.
    :param host: Адрес сервера.
    :param port: Порт сервера.
    :param endpoint: Конечная точка.
    :param user: Имя пользователя учетной записи для авторизации.
    :param password: Пароль учетной записи для авторизации.
    :param payload: Тело сообщения json.
    :param method: HTTP метод. Поддерживается только POST.
    :return: Ответ на запрос.
    """
    request_timeout = await get_settings('fesb_request_timeout')

    host = host[:-1] if host.endswith('/') else host
    endpoint = endpoint[1:] if endpoint.startswith('/') else endpoint
    endpoint = endpoint[:-1] if endpoint.endswith('/') else endpoint
    url = f"{host}:{port}/{endpoint}"
    method = method.upper()

    if method not in ["POST"]:
        raise ValueError('Неподдерживаемый HTTP метод.')

    session = get_fesb_http_session()
    request_kwargs = dict(json=payload, auth=aiohttp.BasicAuth(user, password))

    try:
        async with asyncio.timeout(request_timeout):
            resp = await session.post(url, **request_kwargs)


    except asyncio.TimeoutError:
        raise FesbRequestTimeoutError(f"Превышено максимальное время ожидания ответа от FESB. "
                                      f"Максимальное время ответа: {request_timeout}с.")

    resp.raise_for_status()
    return resp


async def get_message_error_text(exchange_id: str, request_id: str) -> str:
    """
    Запросить в FESB текст ошибки по заданному сообщению.
    :param exchange_id: Идентификатор сообщения exchange_id в FESB.
    :param request_id: Идентификатор сообщения request_id в FESB.
    :return: Текст ошибки в виде строки.
    """
    payload = dict(
        request_id=request_id,
        exchange_id=exchange_id,
        status='ERROR'
    )

    resp = await _call_fesb(HOST, PORT, ERROR_MESSAGE_ENDPOINT, USER, PASSWORD, payload, 'POST')
    resp_payload = await resp.json()
    html = resp_payload.get('html')
    text_pieces = re.findall(r'<pre>(.*?)</pre>', html, flags=re.DOTALL)
    if len(text_pieces) != 2:
        raise ValueError('Непредвиденный ответ FESB на запрос текста ошибки.')
    text_pieces = [p.strip().replace('\n', '. ') for p in text_pieces]
    res = " | ".join(text_pieces)

    logger.debug(f"Получен текст ошибки для сообщения с request_id = {request_id}, exchange_id = {exchange_id}")

    return res


async def get_new_messages(start_date: datetime, end_date: datetime, limit: int | None = None,
                           offset: int = 0) -> list[dict]:
    """
    Получить сообщения FESB за заданный период. Если количество сообщений в ответе меньше общего количества сообщений
    за период (пагинация), то в цикле получить все сообщения, после чего вернуть результат.
    :param start_date: Дата начала создания сообщений FESB.
    :param end_date: Дата окончания создания сообщений FESB.
    :param limit: Максимальное количество сообщений в одном ответе.
    :param offset: Сдвиг - вернуть сообщения, начиная с заданной позиции.
    :return: Массив сообщений, каждое представлено в виде словаря.
    """
    if limit is None:
        limit = await get_settings('fesb_messages_log_limit')
    delay = await get_settings('fesb_messages_log_limit')

    payload = dict(
        skip=offset,
        max=limit,
        filters=list()
    )
    target_period_str = f"{start_date.strftime('%d.%m.%Y %H:%M:%S')} - {end_date.strftime('%d.%m.%Y %H:%M:%S')}"
    payload['filters'].append(dict(field="start_date", value=target_period_str))

    resp = await _call_fesb(HOST, PORT, MESSAGES_LOG_ENDPOINT, USER, PASSWORD, payload, 'POST')
    resp_payload = await resp.json()
    result_list = msg_list = resp_payload.get('list')
    msg_count = resp_payload.get('count')
    if msg_list is None or type(msg_list) != list or msg_count is None or type(msg_count) != int:
        raise ValueError('Некорректный ответ FESB')

    while len(result_list) < msg_count:
        print(f"Message count exceeded message limit. {msg_count - len(result_list)} messages left.")
        await asyncio.sleep(delay)
        payload['skip'] += limit
        resp_payload = await resp.json()
        resp = await _call_fesb(HOST, PORT, MESSAGES_LOG_ENDPOINT, USER, PASSWORD, payload, 'POST')
        msg_list = resp_payload.get('list')
        msg_count = resp_payload.get('count')
        if msg_list is None or type(msg_list) != list or msg_count is None or type(msg_count) != int:
            raise ValueError('Некорректный ответ FESB')

        result_list += msg_list

    logger.debug(f"Запрос получения сообщений из FESB за период {target_period_str} вернул {len(result_list)} шт.")
    return result_list


async def get_message_info(exchange_id: str) -> dict:
    """
    Запросить в FESB данные сообщения с заданными exchange_id.
    :param exchange_id: Идентификатор сообщения exchange_id в FESB.
    :return: Данные сообщения в виде словаря.
    """
    payload = dict(
        skip=0,
        max=1,
        filters=list()
    )
    payload['filters'].append(dict(field="exchange_id", value=exchange_id))

    resp = await _call_fesb(HOST, PORT, MESSAGES_LOG_ENDPOINT, USER, PASSWORD, payload, 'POST')
    resp_payload = await resp.json()
    msg_list = resp_payload.get('list')
    msg_count = resp_payload.get('count')
    if msg_list is None or type(msg_list) != list or len(msg_list) != 1 or msg_count != 1:
        raise ValueError('Непредвиденный ответ FESB на запрос получения сообщений.'
                         f"Message exchange_id: {exchange_id}. "
                         f"Response payload: {resp}."
                         )

    logger.debug(f"Запрос данных сообщения с exchange_id = '{exchange_id}' в FESB успешен.")
    return msg_list[0]
