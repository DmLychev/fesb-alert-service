FROM python:3.14.0-alpine3.22
LABEL authors="dlychev"

ENV PYTHONUNBUFFERED=1

COPY . /app
WORKDIR /app

RUN python -m venv /.venv && \
    /.venv/bin/pip install --upgrade pip && \
    /.venv/bin/pip install -r ./requirements.txt && \
    rm -rf /tmp && \
    adduser --disabled-password --no-create-home fesb-alert-service && \
    mkdir -p /var/log/fesb_alert_service && \
    chown -R fesb-alert-service:fesb-alert-service /var/log/fesb_alert_service && \
    chmod -R 755 /var/log/fesb_alert_service

ENV PATH="/.venv/bin:$PATH"

USER fesb-alert-service

#ENTRYPOINT ["top", "-b"]
CMD ["python main.py"]