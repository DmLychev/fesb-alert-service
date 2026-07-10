"""
Функции для получения сообщений из FESB и обновления их статуса.
"""

import asyncio
import logging
import traceback
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import aiohttp
from aiohttp.client_exceptions import ClientConnectorError, ClientResponseError, ClientConnectorDNSError

from .helpers.fesb import (FesbRequestTimeoutError, get_new_messages, get_message_info, get_message_error_text)
from .helpers.db import (get_settings, db_session_maker, DbRequestTimeoutError, save_messages,
                         get_messages_without_status_and_warning, save_issue, save_fesb_request,
                         get_messages_with_errors_without_error_text)
from .helpers.models import Message

logger = logging.getLogger('message_fetcher')


async def get_fesb_messages_and_save_to_db() -> None:
    """
    Получить сообщения, используя API FESB, и сохранить их в БД приложения.
    :return: None
    """
    messages_get_interval = await get_settings("fesb_messages_get_interval")
    logger.info(f"Получение сообщений FESB запущено с интервалом {messages_get_interval}c.")

    timezone = ZoneInfo(await get_settings("fesb_timezone"))
    now = datetime.now(timezone).replace(microsecond=0)
    time_shift = timedelta(seconds=messages_get_interval)

    start = now - time_shift
    while True:
        messages_get_interval = await get_settings("fesb_messages_get_interval")
        end = datetime.now(timezone).replace(microsecond=0)

        # Получить сообщения
        try:
            messages = await get_new_messages(start, end)

        except (ClientConnectorError, ClientConnectorDNSError) as e:
            msg = f"Ошибка соединения с FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
            logger.warning(msg)
            await save_fesb_request(False, 1, msg)

        except FesbRequestTimeoutError as e:
            msg = f"Превышено время ожидания ответа на запрос получения сообщений от FESB. {type(e)} {e}. Traceback: {traceback.print_exc()}."
            logger.warning(msg)
            await save_fesb_request(False, 1, msg)

        except ClientResponseError as e:
            msg = f"Ошибка получения сообщений FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
            logger.warning(msg)
            await save_fesb_request(False, 1, msg)

        except Exception as e:
            msg = f"Неожиданная ошибка получения сообщений FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
            logger.error(msg)
            await save_issue(type_id=301, text=msg)
            await save_fesb_request(False, 1, msg, 301)

        else:
            # Сохранить в БД.
            try:
                await save_fesb_request(True, 1)
                await save_messages(messages)
            except DbRequestTimeoutError as e:
                msg = f"Превышено время ожидания записи сообщений в БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(msg)
            except Exception as e:
                msg = f"Неожиданная ошибка записи сообщений в БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}"
                logger.critical(msg)
                await save_issue(type_id=302, text=msg)
        finally:
            start = end
            await asyncio.sleep(messages_get_interval)


async def update_status_for_unfinished_messages() -> None:
    """
    Получить сообщения из БД, для которых не указана дата завершения обработки, отправить запрос в FESB, обновить состояние в БД.
    :return: None
    """
    message_update_interval = await get_settings('fesb_messages_update_interval')
    logger.info(f"Обновление статуса незавершенных сообщений FESB запущено с интервалом {message_update_interval}c.")
    while True:
        message_update_interval = await get_settings('fesb_messages_update_interval')

        async with db_session_maker() as db_session:
            try:
                unfinished_messages = await get_messages_without_status_and_warning(db_session)

            except DbRequestTimeoutError as e:
                msg = f"Превышено время ожидания получения незавершенных сообщений из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(msg)

            except (RuntimeError, Exception) as e:
                msg = f"Неожиданная ошибка получения незавершенных сообщений из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(msg)
                await save_issue(type_id=302, text=msg)

            else:
                for message, route in unfinished_messages:
                    try:
                        message = await db_session.merge(message)  # Bind to the session
                        resp = await get_message_info(message.exchange_id)  # The message becomes detached from session

                        message.end_date = resp["end_date"]
                        message.status = resp["status"]
                        message.update_status_attempts += 1

                    except (ClientConnectorError, ClientConnectorDNSError) as e:
                        msg = f"Ошибка соединения с FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.warning(msg)
                        await save_fesb_request(False, 2, msg)

                    except FesbRequestTimeoutError as e:
                        msg = f"Превышено время ожидания ответа на запрос получения сообщений от FESB. {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.warning(msg)
                        await save_fesb_request(False, 2, msg)

                    except ClientResponseError as e:
                        msg = f"Ошибка получения сообщений FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.warning(msg)
                        await save_fesb_request(False, 2, msg)

                    except ValueError as e:
                        msg = f"Ошибка парсинга ответа на запрос получения сообщений FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.warning(msg)
                        await save_fesb_request(False, 2, msg)

                    except DbRequestTimeoutError as e:
                        msg = f"Превышено время ожидания увеличения счетчика: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(msg)

                    except Exception as e:
                        msg = f"Неожиданная ошибка обновления статуса незавершенного сообщения из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(msg)
                        await save_issue(type_id=301, text=msg)
                        await save_fesb_request(False, 2, msg, 301)

                    else:
                        await save_fesb_request(True, 2)

                    finally:
                        await db_session.commit()
                        await asyncio.sleep(await get_settings('fesb_messages_log_interval'))

            finally:
                await asyncio.sleep(message_update_interval)


async def get_error_text_for_messages_with_errors() -> None:
    """
    
    :return: 
    """
    messages_get_interval = await get_settings("fesb_messages_get_interval")
    logger.info(
        f'Получение текста ошибок для сообщений FESB со статусом "ERROR" запущено с интервалом {messages_get_interval}c.')

    while True:
        messages_get_interval = await get_settings("fesb_messages_get_interval")

        async with db_session_maker() as db_session:
            try:
                messages = await get_messages_with_errors_without_error_text(db_session)

            except DbRequestTimeoutError as e:
                msg = f"Превышено время ожидания получения сообщений с ошибками без текста ошибки из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(msg)

            except (RuntimeError, Exception) as e:
                msg = f"Неожиданная ошибка получения сообщений с ошибками без текста ошибки из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(msg)
                await save_issue(type_id=302, text=msg)

            async with aiohttp.ClientSession() as http_session:
                for message, route in messages:
                    message: Message = await db_session.merge(message)  # Bind to the session
                    error_text = "Не удалось получить текст ошибки FESB."
                    try:
                        error_text = await get_message_error_text(message.exchange_id, message.request_id, http_session)

                    except (ClientConnectorError, ClientConnectorDNSError) as e:
                        msg = f"Ошибка соединения с FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.warning(msg)
                        await save_fesb_request(False, 3, msg)

                    except FesbRequestTimeoutError as e:
                        msg = f"Превышено время ожидания ответа на запрос текста ошибки по сообщению от FESB. {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.warning(msg)
                        await save_fesb_request(False, 3, msg)

                    except ClientResponseError as e:
                        msg = f"Ошибка получения текста ошибки по сообщению от FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.warning(msg)
                        await save_fesb_request(False, 3, msg)

                    except ValueError as e:
                        msg = f"Ошибка парсинга ответа на запрос текста ошибки по сообщению от FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.warning(msg)
                        await save_fesb_request(False, 3, msg)

                    except Exception as e:
                        msg = f"Неожиданная ошибка получения текста ошибки по сообщению FESB: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(msg)
                        await save_fesb_request(False, 3, msg)
                        await save_issue(type_id=301, text=msg)

                    else:
                        await save_fesb_request(True, 3)

                    # Сохранить текст ошибки сообщения FESB в БД
                    try:
                        message.error_message = error_text
                        await db_session.commit()

                    except DbRequestTimeoutError as e:
                        msg = f"Превышено время ожидания сохранения текста ошибки в БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(msg)

                    except (RuntimeError, Exception) as e:
                        msg = f"Неожиданная ошибка сохранения текста ошибки в БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(msg)
                        await save_issue(type_id=302, text=msg)

                    # await asyncio.sleep(messages_get_interval)

        await asyncio.sleep(messages_get_interval)
