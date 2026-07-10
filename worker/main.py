import asyncio
import logging

from services.message_fetcher import get_fesb_messages_and_save_to_db, update_status_for_unfinished_messages, \
    get_error_text_for_messages_with_errors
from services.warning_checker import process_messages, process_issues, process_fesb_request_statuses


async def main():
    logger = logging.getLogger('main')
    logger.info("Сервис мониторинга FESB запущен.")

    # Запуск всех корутин
    await asyncio.gather(
        get_fesb_messages_and_save_to_db(),
        update_status_for_unfinished_messages(),
        get_error_text_for_messages_with_errors(),
        process_messages(),
        process_fesb_request_statuses(),
        process_issues(),
    )


if __name__ == '__main__':
    asyncio.run(main())
