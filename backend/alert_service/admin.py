from django.contrib import admin

from alert_service import models
from alert_service.models import SystemSettings


class SystemSettingsAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        if SystemSettings.objects.all().exists():
            return False
        return True

    def has_delete_permission(self, request, obj=None):
        return False


class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'domain_name', 'id', 'description', 'is_active', 'is_tracked']
    list_per_page = 10


class MessageAdmin(admin.ModelAdmin):
    list_display = ['route__name', 'route__domain_name', 'status', 'start_date', 'end_date', 'error_message', 'warning_level',
                    'update_status_attempts', 'exchange_id', 'request_id', 'route__id', 'route__is_tracked',
                    'route__description']
    list_filter = ['status', 'warning_level', 'route__is_tracked']
    search_fields = ['route__id', 'route__name', 'route__domain_name', 'status', 'warning_level']
    list_per_page = 10
    actions = ["reset_warning_level", "apply_success_status"]

    @admin.action(description='Reset warnings')
    def reset_warning_level(modeladmin, request, queryset):
        queryset.update(warning_level=None)

    @admin.action(description="Apply 'SUCCESS' status")
    def apply_success_status(modeladmin, request, queryset):
        queryset.update(status='SUCCESS')

    def has_add_permission(self, request):
        return False


class IssueAdmin(admin.ModelAdmin):
    list_display = ['type__code', 'text', 'route_id', 'domain_name', 'is_notified', 'is_solved', 'created_at',
                    'updated_at']
    list_filter = ['type__code', 'is_notified', 'is_solved']
    list_per_page = 10


class NotificationReceiverAdmin(admin.ModelAdmin):
    list_display = ['issue_type__code', 'email', 'route__name', 'route__id', 'route__domain_name', 'created_at',
                    'updated_at']
    search_fields = ['email', 'route__name', 'route__domain_name']
    list_per_page = 10


class FesbRequestAdmin(admin.ModelAdmin):
    list_display = ['type__title', 'is_successful', 'details', 'warning_level', 'created_at', 'updated_at']
    list_filter = ['type__title', 'is_successful', 'warning_level']
    list_per_page = 10


admin.site.register(models.Route, RouteAdmin)
admin.site.register(models.Message, MessageAdmin)
admin.site.register(models.Issue, IssueAdmin)
admin.site.register(models.NotificationReceiver, NotificationReceiverAdmin)
admin.site.register(models.FesbRequest, FesbRequestAdmin)
