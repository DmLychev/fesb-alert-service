FROM python:3.14.0-alpine3.22
LABEL authors="dlychev"

ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt /tmp/requirements.txt
COPY . /app
COPY ./scripts /scripts
WORKDIR /app
EXPOSE 8000

RUN python -m venv /.venv && \
    apk add --update --no-cache postgresql-client && \
    apk add --update --no-cache --virtual .tmp-build-deps build-base postgresql-dev musl-dev zlib zlib-dev linux-headers && \
    /.venv/bin/pip install --upgrade pip && \
    /.venv/bin/pip install -r /tmp/requirements.txt && \
    rm -rf /tmp && \
    apk del .tmp-build-deps && \
    adduser --disabled-password --no-create-home django-user && \
    mkdir -p /vol/web/media && \
    mkdir -p /vol/web/static && \
    chown -R django-user:django-user /vol && \
    chmod -R 755 /vol && \
    chmod -R +x /scripts

ENV PATH="/scripts:/.venv/bin:$PATH"

USER django-user

CMD ["run.sh"]