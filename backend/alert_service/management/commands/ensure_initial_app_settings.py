from django.core.management import BaseCommand
import logging

from alert_service.models import SystemSettings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Ensures required initial app settings exists in the database'

    def handle(self, *args, **options):
        settings, created = SystemSettings.objects.get_or_create(id=1)

        if created:
            logger.warning(f'Default system settings created')
        else:
            logger.debug(f'System settings already exists')
