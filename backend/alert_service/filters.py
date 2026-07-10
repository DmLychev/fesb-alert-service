from django_filters import FilterSet, CharFilter, NumberFilter, BooleanFilter, ChoiceFilter, IsoDateTimeFilter
from .models import Message


class MessageFilter(FilterSet):
    exchange_id = CharFilter(field_name='exchange_id', lookup_expr='icontains')
    request_id = CharFilter(field_name='request_id', lookup_expr='icontains')
    domain_name = CharFilter(field_name='route__domain_name', lookup_expr='icontains')
    route_name = CharFilter(field_name='route__name', lookup_expr='icontains')
    update_status_attempts = NumberFilter(field_name="update_status_attempts", lookup_expr="exact")
    update_status_attempts_gt = NumberFilter(field_name="update_status_attempts", lookup_expr='gt')
    update_status_attempts_gte = NumberFilter(field_name="update_status_attempts", lookup_expr='gte')
    update_status_attempts_lt = NumberFilter(field_name="update_status_attempts", lookup_expr='lt')
    update_status_attempts_lte = NumberFilter(field_name="update_status_attempts", lookup_expr='lte')
    status = ChoiceFilter(field_name="status", choices=[
        ("error", "ERROR"),
        ("success", "SUCCESS"),
        ("null", "NULL"),

    ], method='filter_status')
    start_date_before = IsoDateTimeFilter(field_name="start_date", lookup_expr='lte')
    start_date_after = IsoDateTimeFilter(field_name="start_date", lookup_expr='gte')
    end_date_before = IsoDateTimeFilter(field_name="end_date", lookup_expr='lte')
    end_date_after = IsoDateTimeFilter(field_name="end_date", lookup_expr='gte')
    warning_level = NumberFilter(field_name="warning_level", lookup_expr='exact')
    warning_level_gt = NumberFilter(field_name="warning_level", lookup_expr='gt')
    warning_level_gte = NumberFilter(field_name="warning_level", lookup_expr='gte')
    warning_level_lt = NumberFilter(field_name="warning_level", lookup_expr='lt')
    warning_level_lte = NumberFilter(field_name="warning_level", lookup_expr='lte')

    def filter_status(self, queryset, name, value):
        if value == 'null':
            return queryset.filter(status__isnull=True)
        return queryset.filter(status=value)

    class Meta:
        model = Message
        fields = ['exchange_id', 'request_id', 'route__domain_name', 'route__name', 'update_status_attempts', 'status',
                  "start_date", "end_date", "warning_level"]
