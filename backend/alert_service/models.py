from django.db import models
from django.core.exceptions import ValidationError


class SystemSettings(models.Model):
    fesb_timezone = models.CharField(max_length=128, default='Europe/Moscow')
    fesb_requests_check_interval = models.SmallIntegerField(default=15)
    fesb_request_timeout = models.SmallIntegerField(default=60)
    fesb_request_errors_threshold = models.SmallIntegerField(default=5)
    fesb_messages_get_interval = models.SmallIntegerField(default=15)
    fesb_messages_update_interval = models.SmallIntegerField(default=120)
    fesb_messages_log_limit = models.SmallIntegerField(default=50)
    fesb_messages_log_interval = models.SmallIntegerField(default=2)
    fesb_single_route_errors_threshold = models.SmallIntegerField(default=3)
    fesb_routes_errors_threshold = models.SmallIntegerField(default=2)
    fesb_domain_errors_threshold = models.SmallIntegerField(default=2)
    fesb_status_update_attempts = models.SmallIntegerField(default=3)
    db_timeout = models.SmallIntegerField(default=30)
    messages_check_warning_interval = models.SmallIntegerField(default=30)
    auto_track_new_routes = models.BooleanField(default=True)
    issues_check_interval = models.SmallIntegerField(default=15)
    admin_email = models.CharField(max_length=128, null=True)
    inform_admin_if_no_receivers = models.BooleanField(default=False)
    smtp_delay = models.SmallIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_service_settings'
        constraints = [models.CheckConstraint(check=models.Q(id=1), name='only_one_settings_row')]

    def save(self, *args, **kwargs):
        self.id = 1
        super().save(*args, **kwargs)

    def clean(self):
        if SystemSettings.objects.exclude(id=self.id).exists():
            raise ValidationError('Settings already exists. You can change them, not create new ones.')


class Route(models.Model):
    id = models.CharField(primary_key=True, max_length=128)
    name = models.CharField(max_length=256, blank=False, null=False)
    description = models.TextField(blank=True, null=True)
    domain_name = models.CharField(max_length=128, blank=False, null=False)
    is_active = models.BooleanField(default=True)
    is_tracked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_service_routes'

    def __str__(self):
        return self.name


class IssueScope(models.TextChoices):
    GLOBAL = "GLOBAL", "Global"
    DOMAIN = "DOMAIN", "Domain"
    ROUTE = "ROUTE", "Route"


class IssueType(models.Model):
    code = models.SmallIntegerField(unique=True, primary_key=True)
    description = models.TextField()
    scope = models.CharField(max_length=16, choices=IssueScope.choices, default=IssueScope.GLOBAL)

    class Meta:
        db_table = 'alert_service_issue_types'

    def __str__(self):
        return str(f"{self.scope} {self.code}")


class Message(models.Model):
    exchange_id = models.CharField(max_length=128, blank=False, null=False)
    request_id = models.CharField(max_length=128, blank=True, null=True)
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='messages')
    error_message = models.TextField(blank=True, null=True)
    update_status_attempts = models.SmallIntegerField(default=0)
    status = models.CharField(max_length=16, blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(blank=True, null=True)
    warning_level = models.SmallIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_service_messages'
        unique_together = ['exchange_id', 'route']
        indexes = [models.Index(fields=["start_date"], name="msg_start_idx")]

    def __str__(self):
        return self.request_id


class NotificationReceiver(models.Model):
    issue_type = models.ForeignKey(IssueType, on_delete=models.CASCADE, null=True,
                                   related_name='notification_receivers')
    route = models.ForeignKey(Route, on_delete=models.CASCADE, null=True, related_name='notification_receivers')
    domain_name = models.CharField(max_length=128, blank=False, null=True)
    email = models.EmailField(blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_service_notification_receivers'
        constraints = [
            models.CheckConstraint(
                condition=(
                        models.Q(route__isnull=True)
                        | models.Q(domain_name__isnull=True)
                ),
                name="notification_receiver_not_route_and_domain"
            ),

            models.UniqueConstraint(
                fields=["email", "issue_type", "route", "domain_name"],
                nulls_distinct=False,
                name="unique_notification_receiver_rule"
            )
        ]

    def __str__(self):
        text = ''
        text += f' - {self.domain_name}' if self.domain_name else ''
        text += f' - {self.route.name}' if self.route else ''
        text += f' - {self.email}'
        return text


class Issue(models.Model):
    type = models.ForeignKey(IssueType, on_delete=models.CASCADE, related_name='issues')
    text = models.TextField()
    route_id = models.CharField(max_length=128, blank=False, null=True)
    domain_name = models.CharField(max_length=128, blank=False, null=True)
    is_notified = models.BooleanField(default=False, null=True)
    is_solved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_service_issues'
        indexes = [models.Index(fields=["created_at"], name="issue_created_idx")]

    def __str__(self):
        return f"{self.type.code} - {self.text}"


class FesbRequestType(models.Model):
    title = models.CharField(max_length=128, blank=False, null=False, unique=True)

    class Meta:
        db_table = 'alert_service_fesb_request_types'

    def __str__(self):
        return f"{self.title}"


class FesbRequest(models.Model):
    type = models.ForeignKey(FesbRequestType, on_delete=models.CASCADE, related_name='requests')
    is_successful = models.BooleanField(default=True)
    details = models.TextField(blank=True, null=True)
    warning_level = models.SmallIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_service_fesb_requests'
        indexes = [models.Index(fields=["created_at"], name="fesb_req_created_idx")]

    def __str__(self):
        return f"{self.created_at.isoformat()} - {self.is_successful}"
