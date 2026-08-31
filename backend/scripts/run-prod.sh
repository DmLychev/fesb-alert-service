#!/bin/sh
set -e

python manage.py wait_for_db
python manage.py migrate --noinput
python manage.py loaddata ./alert_service/fixtures/*.json
python manage.py collectstatic --noinput

exec daphne -b 0.0.0.0 -p 8000 app.asgi:application
