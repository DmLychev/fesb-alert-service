"""
Корутины для обработки сообщений.
"""

import logging
import traceback
import asyncio

from services.helpers.db import (db_session_maker, DbRequestTimeoutError, get_unchecked_messages, get_issues,
                                 save_issue, get_fesb_requests, get_settings)
from services.helpers.check import (set_message_warning_level_and_create_issue, check_issue_is_solved, define_receivers,
                                    check_request_and_create_issue)
from services.helpers.email import send_email, SmtpError
from services.helpers.redis import publish_updated_issues, publish_updated_requests

logger = logging.getLogger("warning_checker")


async def process_messages() -> None:
    """
    Отфильтровать необработанные сообщения из БД и вычислить и сохранить в БД их уровень угрозы.
    """
    messages_check_warning_interval = await get_settings('messages_check_warning_interval')
    logger.info(f"Обработка сообщений запущена с интервалом {messages_check_warning_interval}с.")
    while True:
        messages_check_warning_interval = await get_settings('messages_check_warning_interval')

        async with db_session_maker() as session:
            try:
                unchecked_messages = await get_unchecked_messages(session)

            except DbRequestTimeoutError as e:
                error_msg = f"Превышено время ожидания получения необработанных сообщений из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(error_msg)

            except (RuntimeError, Exception) as e:
                error_msg = f"Неожиданная ошибка получения необработанных сообщений из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(error_msg)
                await save_issue(type_id=302, text=error_msg)

            else:
                for message, route in unchecked_messages:
                    try:
                        await set_message_warning_level_and_create_issue(message, route, session)

                    except DbRequestTimeoutError as e:
                        error_msg = f"Превышено время ожидания сохранения проблемы в БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(error_msg)

                    except (RuntimeError, Exception) as e:
                        error_msg = f"Неожиданная ошибка сохранения проблемы в БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(error_msg)
                        await save_issue(type_id=302, text=error_msg)

            finally:
                await asyncio.sleep(messages_check_warning_interval)


async def process_issues():
    check_interval = await get_settings('issues_check_interval')
    logger.info(f"Обработка проблем запущена с интервалом {check_interval}с.")
    while True:
        check_interval = await get_settings('issues_check_interval')

        async with db_session_maker() as session:
            try:
                unsolved_issues = await get_issues(unsolved_only=True, session=session)
                logger.debug(f"Нерешенных проблем: {len(unsolved_issues)} шт.")

            except DbRequestTimeoutError as e:
                error_msg = f"Превышено время ожидания получения нерешенных проблем из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(error_msg)

            except (RuntimeError, Exception) as e:
                error_msg = f"Неожиданная ошибка получения нерешенных проблем из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(error_msg)
                await save_issue(type_id=302, text=error_msg)

            else:
                for issue in unsolved_issues:
                    try:
                        # Если проблема решена
                        if await check_issue_is_solved(
                                issue,
                                session,
                                unsolved_issues,
                        ):
                            issue.is_solved = True
                            await session.commit()

                            await publish_updated_issues(
                                [issue.id],
                                active_delta=-1,
                            )

                            logger.debug(
                                f"Проблема с кодом {issue.type_id} "
                                "была решена."
                            )

                            continue

                        # Отправить уведомление
                        if issue.is_notified == False:
                            receivers = await define_receivers(issue, session)

                            if receivers:
                                logger.debug(f'Готовится отправка уведомлений следующим получателям: {receivers}')

                                for receiver in receivers:
                                    await send_email(
                                        subject=f"{issue.type_id} | Ошибка в работе интеграционной шины FESB",
                                        body=issue.text,
                                        receiver_email=receiver
                                    )
                                    await asyncio.sleep(await get_settings('smtp_delay', session))

                                issue.is_notified = True
                            else:
                                logger.debug(
                                    f'Отсутствуют получатели для доставки уведомления о проблеме с кодом {issue.type_id}.')
                                issue.is_notified = None

                            await session.commit()
                            await publish_updated_issues(
                                [issue.id],
                            )

                    except DbRequestTimeoutError as e:
                        error_msg = f"Превышено время ожидания ответа от БД приложения во время обработки проблемы: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(error_msg)

                    except SmtpError as e:
                        error_msg = f"Ошибка отправки уведомлений: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(error_msg)
                        await save_issue(type_id=104, text=error_msg)

                    except (RuntimeError, Exception) as e:
                        error_msg = f"Неожиданная ошибка от БД приложения во время обработки проблемы: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(error_msg)
                        await save_issue(type_id=302, text=error_msg)

            finally:
                await asyncio.sleep(check_interval)


async def process_fesb_request_statuses():
    check_interval = await get_settings('fesb_requests_check_interval')
    logger.info(f"Обработка статусов запросов к API FESB запущена с интервалом {check_interval}с.")
    while True:
        check_interval = await get_settings('fesb_requests_check_interval')

        async with db_session_maker() as session:
            try:
                unchecked_requests = await get_fesb_requests(unchecked_only=True, session=session)

            except DbRequestTimeoutError as e:
                error_msg = f"Превышено время ожидания получения статуса запросов к FESB из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(error_msg)

            except (RuntimeError, Exception) as e:
                error_msg = f"Неожиданная ошибка получения статуса запросов к FESB из БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                logger.critical(error_msg)
                await save_issue(type_id=302, text=error_msg)

            else:
                updated_request_ids: list[int] = []

                for req in unchecked_requests:
                    try:
                        await check_request_and_create_issue(req, session)
                        updated_request_ids.append(req.id)

                    except DbRequestTimeoutError as e:
                        error_msg = f"Превышено время ожидания сохранения проблемы в БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(error_msg)

                    except (RuntimeError, Exception) as e:
                        error_msg = f"Неожиданная ошибка сохранения проблемы в БД приложения: {type(e)} {e}. Traceback: {traceback.print_exc()}."
                        logger.critical(error_msg)
                        await save_issue(type_id=302, text=error_msg)

                if updated_request_ids:
                    await publish_updated_requests(updated_request_ids)

            finally:
                await asyncio.sleep(check_interval)
