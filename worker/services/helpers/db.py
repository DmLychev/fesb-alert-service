"""
Набор функций для обращений к БД приложения.
"""

import logging
import asyncio
from functools import wraps
import os
import re
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo
from sqlalchemy import select, or_, and_, Sequence, func, over, desc
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.dialects.postgresql import insert

from .models import Route, Message, Issue, NotificationReceiver, FesbRequest, SystemSettings

HOST = os.getenv('DB_HOST')
USER = os.getenv('DB_USER')
PASSWORD = os.getenv('DB_PASS')
DATABASE = os.getenv('DB_NAME')
assert HOST and USER and PASSWORD and DATABASE, "Invalid DB connection environment variables"

logger = logging.getLogger('db')
engine = create_async_engine(f"postgresql+asyncpg://{USER}:{PASSWORD}@{HOST}/{DATABASE}")
db_session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


class DbRequestTimeoutError(Exception):
    """
    Превышено максимальное время ожидания ответа от FESB.
    """

    def __init__(self, message):
        super().__init__(message)
        self.message = message


def _format_fesb_datatime(fesb_datetime: str) -> datetime | None:
    """
    Преобразует строку времени из формата, используемого FESB, в стандартный ISO формат с учетом часового пояса FESB.
    :param fesb_datetime: Строка с датой и временем в формате FESB.
    :return: Строка с датой и временем в формате ISO.
    """
    try:
        input_datetime = re.findall(r"/Date\((.*)\)/", fesb_datetime)
        date_obj = datetime.strptime(input_datetime[0], '%Y-%m-%dT%H:%M:%S.%f')
        date_with_timezone = date_obj.replace(tzinfo=ZoneInfo(os.getenv('FESB_TZ', 'Europe/Moscow')))
        return date_with_timezone.astimezone(ZoneInfo('UTC'))
    except Exception as e:
        logger.warning(f"Не удалось преобразовать дату и время сообщения из ответа FESB к ISO формату: {type(e)} {e}. "
                       f"Ошибочное значение даты и времени: {fesb_datetime}")
        return None


def _handle_timeout_error(func):
    """
    Декоратор асинхронных функций для оборачивания ошибок таймаута обращений к БД приложения
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        db_timeout = await get_settings('db_timeout')
        try:
            async with asyncio.timeout(db_timeout):
                return await func(*args, **kwargs)
        except asyncio.TimeoutError as e:
            msg = (f"Превышено время ожидания обращения к БД приложения: {e}. "
                   f"Максимальное время ожидания ответа: {db_timeout}с.")
            logger.critical(msg)
            raise DbRequestTimeoutError(msg)

    return wrapper


async def get_settings(parameter: str | None = None,
                       session: AsyncSession | None = None) -> dict | str | int | bool | None:
    """
    Получает актуальные настройки из БД приложения.
    :param parameter: Наименование параметра (настройки). При отсутствии возвращает словарь со всеми параметрами.
    :param session: Сессия подключения к БД. При отсутствии создает и закрывает новую.
    :return: Значение конкретной настройки или словарь со всеми настройками.
    """
    query = select(SystemSettings).where(SystemSettings.id == 1)

    if session and session.is_active:
        res = await session.execute(query)
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)

    settings = res.scalar_one_or_none()

    if not settings:
        logger.warning(
            f"В БД приложения отсутствуют настройки, новая запись со значениями по умолчанию будет добавлена.")
        new_settings = SystemSettings(id=1)

        if session and session.is_active():
            session.add(new_settings)
            await session.commit()
            res = await session.execute(query)
        else:
            async with db_session_maker() as new_session:
                new_session.add(new_settings)
                await new_session.commit()
                res = await new_session.execute(query)

        settings = res.scalar_one_or_none()

    if parameter:
        if hasattr(settings, parameter):
            return getattr(settings, parameter)
        else:
            logger.error(f'Не удалось получить настройку {parameter} из таблицы настроек приложения.')
            return None
    return settings


@_handle_timeout_error
async def save_messages(messages: list[dict]) -> None:
    """
    Сохранить сообщения в БД приложения.
    :param messages: Массив сообщений, каждое из которых представлено словарем.
    :return: None
    """
    async with db_session_maker() as session:
        for msg in messages:
            route = dict(
                id=msg["route_id"],
                name=msg["route_name"],
                description=msg["route_description"],
                domain_name=msg["domain_name"],
                is_tracked=True if await get_settings('auto_track_new_routes') else False
            )

            message = dict(
                exchange_id=msg["exchange_id"],
                request_id=msg["request_id"],
                route_id=msg["route_id"],
                status=msg["status"],
                error_message=msg.get('error_message', ''),
                start_date=_format_fesb_datatime(msg["start_date"]),
                end_date=_format_fesb_datatime(msg["end_date"]) if msg["end_date"] else None,
            )

            insert_route = insert(Route).values(route)
            insert_message = insert(Message).values(message)

            on_conflict_route = insert_route.on_conflict_do_update(
                index_elements=['id'],
                set_=dict(name=insert_route.excluded.name,
                          description=insert_route.excluded.description,
                          domain_name=insert_route.excluded.domain_name)
            )
            on_conflict_message = insert_message.on_conflict_do_update(
                index_elements=['exchange_id', 'route_id'],
                set_=dict(status=insert_message.excluded.status,
                          end_date=insert_message.excluded.end_date)
            )

            await session.execute(on_conflict_route)
            await session.execute(on_conflict_message)

        await session.commit()
        logger.debug(f"Сохранено {len(messages)} сообщений.")


@_handle_timeout_error
async def save_issue(type_id: int, text: str, route_id: int | None = None, domain_name: str | None = None,
                     session: AsyncSession | None = None) -> None:
    """
    Сохранить проблему в БД.
    :param type_id:
    :param text:
    :param route_id:
    :param domain_name:
    :param session:
    :return:
    """
    issue = Issue(type_id=type_id, text=text, route_id=route_id, domain_name=domain_name)
    issue_code = issue.type_id

    query = (select(Issue)
             .where(Issue.type_id == type_id)
             .where(Issue.route_id == route_id)
             .where(Issue.domain_name == domain_name)
             .where(Issue.text == text)
             )

    if session and session.is_active:
        duplicate_issues = await session.execute(query)
        if duplicate_issues.scalars().first():
            logger.info(f"Новая проблема с кодом {issue_code} не создана, так как существует такая же нерешенная.")
            return None
        session.add(issue)
        await session.commit()
    else:
        async with db_session_maker() as new_session:
            duplicate_issues = await new_session.execute(query)
            if duplicate_issues.scalars().first():
                logger.debug(f"Новая проблема с кодом {issue_code} не создана, так как существует такая же нерешенная.")
                return None
            new_session.add(issue)
            await new_session.commit()

    logger.info(f"Создана проблема с кодом {issue_code}.")
    return None


async def get_following_messages(start_date: datetime, route_id: int | None = None,
                                 session: AsyncSession | None = None) -> Sequence[Message]:
    """
    Получить все сообщения с заданной даты.
    :param start_date: Дата начала обработки сообщения.
    :param route_id: Идентификатор СОПС.
    :param session:
    :return: Массив сообщений.
    """
    query = select(Message).where(Message.start_date > start_date)
    if route_id:
        query = query.where(Message.route_id == route_id)

    if session and session.is_active:
        res = await session.execute(query)
        rows = res.scalars().all()
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)
            rows = res.scalars().all()

    return rows


# ToDo unite the function to get messages with different conditions
async def get_messages_without_status_and_warning(session: AsyncSession | None = None) -> Sequence[
    tuple[Message, Route]]:
    """
    Получить необработанные ранее сообщения из БД.
    :return: Сообщения и связанные маршруты
    """
    time_thresh = datetime.now() - timedelta(seconds=int(os.getenv('MESSAGE_STATUS_UPDATER_DELAY', 120)))
    query = select(Message, Route).join(Route).where(Message.warning_level.is_(None)).where(
        Message.status.is_(None)).where(
        Message.update_status_attempts >= 0).where(
        Message.update_status_attempts < await get_settings('fesb_status_update_attempts')).where(
        Message.updated_at < time_thresh)

    if session and session.is_active:
        res = await session.execute(query)
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)

    rows = res.all()
    logger.debug(f"Функция get_messages_without_status_and_warning вернула {len(rows)} строк.")
    return rows


async def get_unchecked_messages(session: AsyncSession | None = None) -> Sequence[
    tuple[Message, Route]]:
    """
    Получить новые, ранее не обработанные сообщения из БД.
    :param session:
    :return:
    """
    success_condition = Message.status == "SUCCESS"
    error_condition = and_(Message.status == "ERROR", Message.error_message.is_not(None), Message.error_message != "")
    unfinished_condition = and_(or_(Message.status.is_(None), Message.status == ""),
                                Message.update_status_attempts >= await get_settings('fesb_status_update_attempts'))

    query = (select(Message, Route).join(Route).
             where(Message.warning_level.is_(None)).
             where(or_(success_condition, error_condition, unfinished_condition)).
             order_by(Message.start_date.asc()))

    if session and session.is_active:
        res = await session.execute(query)
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)

    rows = res.all()
    logger.debug(f"Функция get_unchecked_messages вернула {len(rows)} строк.")
    return rows


async def get_messages_with_errors_without_error_text(session: AsyncSession | None = None) -> Sequence[
    tuple[Message, Route]]:
    """

    :return:
    """
    err_condition = and_(Message.status == "ERROR", or_(Message.error_message.is_(None), Message.error_message == ""))

    query = (select(Message, Route).join(Route).
             where(Message.warning_level.is_(None)).
             where(err_condition).
             order_by(Message.start_date.asc()))

    if session and session.is_active:
        res = await session.execute(query)
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)

    rows = res.all()
    logger.debug(f"Функция get_messages_with_errors_without_error_text вернула {len(rows)} строк.")
    return rows


async def get_previous_messages_in_route(message: Message, quantity: int,
                                         session: AsyncSession | None = None) -> Sequence[Message]:
    """
    Получить сообщения внутри СОПС, предшествующие заданному сообщению.
    :param message:
    :param quantity:
    :param session:
    :return:
    """
    query = select(Message).where(Message.route_id == message.route_id).where(
        Message.start_date < message.start_date).order_by(
        Message.start_date.desc()).limit(quantity)

    if session and session.is_active:
        res = await session.execute(query)
        rows = res.scalars().all()
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)
            rows = res.scalars().all()

    logger.debug(f"Функция get_previous_messages_in_route вернула {len(rows)} строк из {quantity} запрошенных.")
    return rows


async def get_last_warning_levels_for_routes_in_domain(domain_name: str, session: AsyncSession | None = None) -> \
        Sequence[str | None, int | None]:
    """
    Получить последние значения уровня угрозы в разрезе по СОПС домена.
    :param domain_name: Наименование домена.
    :param session: 
    :return: Массив строк со следующими столбцами:
    1. Идентификатор СОПС (route_id),
    2. Уровень угрозы (warning_level) в последнем сообщении СОПС.
    """
    subquery_all = (
        select(
            Message.route_id,
            func.last_value(Message.warning_level)
            .over(
                partition_by=Message.route_id,
                order_by=Message.created_at,
                range_=(None, None)  # UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ).label('route_last_warning_level')
        )
        .join(Route, Route.id == Message.route_id)
        .where(Route.domain_name == domain_name)
        .order_by(Message.created_at.desc())
        .subquery()
    )

    distinct_routes = select(subquery_all).distinct()

    if session and session.is_active:
        res = await session.execute(distinct_routes)
        rows = res.all()
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(distinct_routes)
            rows = res.all()

    # logger.debug(f"Функция get_last_warning_levels_for_routes_in_domain вернула {len(rows)} строк.")
    return rows


async def get_last_warning_levels_for_domains(session: AsyncSession | None = None) -> Sequence[str | None, int | None]:
    """
    Получить последние значения уровня угрозы в разрезе по доменам.
    :param session:
    :return: Массив строк со следующими столбцами:
    1. Наименование домена (domain_name),
    2. Уровень угрозы (warning_level) в последнем сообщении среди всех СОПС домена.
    """
    subquery_all = (
        select(
            Route.domain_name,
            func.last_value(Message.warning_level)
            .over(
                partition_by=Route.domain_name,
                order_by=Message.created_at,
                range_=(None, None)
            ).label('domain_last_warning_level')
        )
        .join(Message, Route.id == Message.route_id)
        .order_by(Message.created_at.desc())
        .subquery()
    )

    distinct_domains = select(subquery_all).distinct()

    if session and session.is_active:
        res = await session.execute(distinct_domains)
        rows = res.all()
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(distinct_domains)
            rows = res.all()

    # logger.debug(f"Функция get_last_warning_levels_for_domains вернула {len(rows)} строк.")
    return rows


async def get_issues(unsolved_only: bool = False, created_on_date: datetime | None = None,
                     session: AsyncSession | None = None) -> Sequence[Issue]:
    """
    Получить нерешенные проблемы.
    :param unsolved_only:
    :param created_on_date:
    :param session:
    :return: Массив проблем.
    """
    query = select(Issue)
    if unsolved_only:
        query = query.where(Issue.is_solved.is_not(True))
    if created_on_date:
        start_date = created_on_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = created_on_date.replace(hour=23, minute=59, second=59, microsecond=0)
        query = query.where(Issue.created_at > start_date).where(Issue.created_at < end_date)

    if session and session.is_active:
        res = await session.execute(query)
        rows = res.scalars().all()
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)
            rows = res.scalars().all()

    logger.debug(f'Нерешенных проблем найдено: {len(rows)} штук.')
    return rows


async def get_receivers(issue_type_id: int | None = None, route_id: str | None = None, domain_name: str | None = None,
                        session: AsyncSession | None = None) -> Sequence[NotificationReceiver]:
    """
    Получить email для отправки уведомления.
    :param issue_type_id:
    :param route_id: Идентификатор СОПС.
    :param domain_name: Название домена СОПС.
    :param session:
    :return:
    """
    query = select(NotificationReceiver)

    if issue_type_id:
        query = query.where(NotificationReceiver.issue_type_id == issue_type_id)
    if route_id:
        query = query.where(NotificationReceiver.route_id == route_id)
    if domain_name:
        query = query.where(NotificationReceiver.domain_name == domain_name)

    if session and session.is_active:
        res = await session.execute(query)
        rows = res.scalars().all()

    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)
            rows = res.scalars().all()

    return rows


async def save_fesb_request(is_successful: bool,
                            type_id: int,
                            details: str | None = None,
                            warning_level: int | None = None,
                            session: AsyncSession | None = None
                            ) -> None:
    request = FesbRequest(is_successful=is_successful, type_id = type_id, warning_level=warning_level, details=details)
    if session and session.is_active:
        session.add(request)
        await session.commit()
    else:
        async with db_session_maker() as new_session:
            new_session.add(request)
            await new_session.commit()


async def get_fesb_requests(session: AsyncSession | None = None,
                            is_successful: bool | None = None,
                            start_date: datetime | None = None,
                            unchecked_only: bool = False,
                            descending_order=False,
                            limit: int | None = None,
                            ) -> Sequence[FesbRequest]:
    query = select(FesbRequest)
    if is_successful is not None:
        query = query.where(FesbRequest.is_successful.is_(is_successful))
    if start_date:
        query = query.where(FesbRequest.created_at > start_date)
    if unchecked_only:
        query = query.where(FesbRequest.warning_level.is_(None))

    if session and session.is_active:
        res = await session.execute(query)
        rows = res.scalars().all()
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)
            rows = res.scalars().all()

    return rows


async def get_previous_fesb_requests(req: FesbRequest, quantity: int,
                                     session: AsyncSession | None = None) -> Sequence[FesbRequest]:
    query = (select(FesbRequest).where(FesbRequest.created_at < req.created_at)
             .order_by(FesbRequest.created_at.desc()).limit(quantity))

    if session and session.is_active:
        res = await session.execute(query)
        rows = res.scalars().all()
    else:
        async with db_session_maker() as new_session:
            res = await new_session.execute(query)
            rows = res.scalars().all()

    return rows
