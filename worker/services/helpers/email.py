import logging
import traceback
import smtplib
from email.message import EmailMessage
import ssl
import os

logger = logging.getLogger('email')


class SmtpError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.message = message


async def send_email(subject: str,
                     body: str,
                     receiver_email: str,
                     sender_email=os.getenv('SMTP_SENDER_EMAIL'),
                     smtp_server=os.getenv('SMTP_SERVER'),
                     port=int(os.getenv('SMTP_PORT', 587)),
                     password=os.getenv('SMTP_PASSWORD')) -> bool:
    message = EmailMessage()
    message.set_content(body)
    message['Subject'] = subject
    message['From'] = sender_email
    message['To'] = receiver_email
    context = ssl._create_unverified_context()

    try:
        with smtplib.SMTP(smtp_server, port) as server:
            server.ehlo()  # Can be called optionally
            server.starttls(context=context)  # Secure the connection with TLS
            server.ehlo()  # Re-identify to the server post-STARTTLS
            server.login(sender_email, password)
            server.send_message(message)

    except (smtplib.SMTPException, ssl.SSLError, Exception) as e:
        raise SmtpError(f"Ошибка отправки уведомления на электронную почту {receiver_email}: {type(e)} {e}. Traceback: {traceback.print_exc()}")
    else:
        logger.info(f"Уведомление на электронную почту {receiver_email} успешно отправлено.")
        return True
