"""
Настройка логирования/
"""

import os
import logging
from logging.handlers import RotatingFileHandler

logging_dir = '/var/log/fesb_alert_service'
if not os.path.exists(logging_dir):
    os.mkdir(logging_dir)
logger = logging
formatter = logging.Formatter(fmt='%(asctime)s.%(msecs)03d | %(name)s | %(levelname)s | %(message)s',
                              datefmt='%Y.%m.%d %H:%M:%S')
file_handler = RotatingFileHandler(filename=os.path.join(logging_dir, 'fesb_alert_service.log'),
                                   maxBytes=10 * 1024 * 1024, backupCount=10)
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(formatter)
handlers = [file_handler, console_handler]

logger.basicConfig(handlers=handlers, level=logging.DEBUG)
