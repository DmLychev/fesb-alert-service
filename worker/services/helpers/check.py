"""
Функции для обработки сообщений и проблем.
"""

import logging

from sqlalchemy import Sequence
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Message, Route, Issue, FesbRequest
from .db import (get_previous_messages_in_route, get_last_warning_levels_for_routes_in_domain, save_issue,
                 get_following_messages, get_issues, get_previous_fesb_requests, get_fesb_requests,
                 get_settings, get_receiver_emails_for_issue)

logger = logging.getLogger("scoring")


async def set_message_warning_level_and_create_issue(message: Message, route: Route, session: AsyncSession) -> Message:
    """

    :param message:
    :param route:
    :param session:
    :return:
    """
    single_route_errors_threshold = await get_settings('fesb_single_route_errors_threshold')
    routes_errors_threshold = await get_settings('fesb_routes_errors_threshold')
    domain_errors_threshold = await get_settings('fesb_domain_errors_threshold')

    # Определить первичный уровень угрозы
    if not route.is_tracked:
        message.warning_level = 0
        await session.commit()
        return message
    elif message.status == "SUCCESS":
        message.warning_level = -1
        await session.commit()
        return message
    elif message.status == "ERROR":
        message.warning_level = 4
        await save_issue(type_id=204, route_id=message.route_id, session=session, domain_name=route.domain_name,
                         text=f'Разовая ошибка в СОПС "{route.name}" с exchange_id = "{message.exchange_id}": {message.error_message}.')
    elif message.update_status_attempts >= await get_settings('fesb_status_update_attempts'):
        message.warning_level = 5
        await save_issue(type_id=205, route_id=message.route_id, session=session, domain_name=route.domain_name,
                         text=f'Обработка сообщения в СОПС "{route.name}" с exchange_id = "{message.exchange_id}" '
                              f'не была завершена, статус сообщения неизвестен.')
    else:
        return message

    # Повысить уровень угрозы до 3
    previous_messages = await get_previous_messages_in_route(message, single_route_errors_threshold - 1, session)

    if len(previous_messages) >= single_route_errors_threshold - 1 and all(
            [m.warning_level and m.warning_level > 0 for m in previous_messages]):
        message.warning_level = 3
        await save_issue(type_id=203, route_id=message.route_id, session=session, domain_name=route.domain_name,
                         text=f'Массовая ошибка в СОПС "{route.name}", {single_route_errors_threshold} '
                              f'сообщений подряд завершились ошибками.')

        last_routes_warning_levels = await get_last_warning_levels_for_routes_in_domain(route.domain_name, session)
        logger.debug(f"last_routes_warning_levels for a domain: {route.domain_name} are {last_routes_warning_levels}")

        # Повысить уровень угрозы до 2
        if len(last_routes_warning_levels) and len(
                [r for r in last_routes_warning_levels if r[1] and 3 >= r[1] > 0 and r[0] != message.route_id]
        ) >= routes_errors_threshold - 1:
            message.warning_level = 2
            await save_issue(type_id=202, session=session, domain_name=route.domain_name,
                             text=f'Массовая ошибка в СОПС Домена "{route.domain_name}".')

            # Повысить уровень угрозы до 1
            unsolved_issues = await get_issues(unsolved_only=True, session=session)
            unique_faulty_domain_names = list(set([i.domain_name for i in unsolved_issues if i.type_id == 202]))
            if len(unique_faulty_domain_names) >= domain_errors_threshold:
                message.warning_level = 1
                await save_issue(type_id=201, session=session, text=f'Массовая ошибка в СОПС нескольких доменов.')

    await session.commit()
    logger.debug(f"Сообщению с exchange_id = '{message.exchange_id}' присвоен warning_level = {message.warning_level}.")

    return message


async def check_issue_is_solved(issue: Issue, session: AsyncSession, unsolved_issues: Sequence[Issue]) -> bool:
    """
    Проверить, что проблема решена.
    :param issue:
    :param session:
    :param unsolved_issues:
    :return:
    """
    routes_errors_threshold = await get_settings('fesb_routes_errors_threshold')
    domain_errors_threshold = await get_settings('fesb_domain_errors_threshold')
    code = issue.type_id

    if code in [101, 102]:
        following_fesb_requests = await get_fesb_requests(start_date=issue.created_at, session=session)
        if len(following_fesb_requests) > 0 and any([r.is_successful for r in following_fesb_requests]):
            return True

    if code in [205, 204, 203]:
        following_route_messages = await get_following_messages(start_date=issue.created_at, route_id=issue.route_id,
                                                                session=session)
        if any([m.warning_level == 0 or m.warning_level == -1 for m in following_route_messages]):
            return True
    if code == 202:  # ToDo Здесь логика повторяется с таковой в функции apply_warning_level - выделить
        last_routes_warning_levels = await get_last_warning_levels_for_routes_in_domain(issue.domain_name, session)
        if len(last_routes_warning_levels) > 0 and len(
                [r for r in last_routes_warning_levels if r[1] and 3 >= r[1] > 0]) >= routes_errors_threshold:
            return False
        return True
    if code == 201:
        unique_faulty_domain_names = list(set([i.domain_name for i in unsolved_issues if i.type_id == 202]))
        if len(unique_faulty_domain_names) < domain_errors_threshold:
            return True

    if code // 100 == 3:
        return False

    return False


async def define_receivers(issue: Issue, session: AsyncSession) -> list[str]:
    emails = await get_receiver_emails_for_issue(issue, session)

    if emails:
        return emails

    admin_email = await get_settings("admin_email")

    if await get_settings("inform_admin_if_no_receivers") and admin_email:
        return [admin_email]

    return []


async def check_request_and_create_issue(req: FesbRequest, session: AsyncSession) -> FesbRequest:
    """
    Проверить статусы http запросов к FESB, создать проблемы в случае ошибок.
    :param req:
    :param session:
    :return:
    """
    errors_threshold = await get_settings('fesb_request_errors_threshold') - 1

    if req.is_successful:
        req.warning_level = -1
        await session.commit()
        return req

    previous_requests = await get_previous_fesb_requests(req, errors_threshold, session)
    if len(previous_requests) >= errors_threshold and all([not r.is_successful for r in previous_requests]):
        req.warning_level = 101
        await save_issue(type_id=101, text=req.details, session=session)
    else:
        req.warning_level = 102
        await save_issue(type_id=102, text=req.details, session=session)
    await session.commit()

    return req
