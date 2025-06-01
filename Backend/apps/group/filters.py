
from django_filters import rest_framework as filters
from .models import Order

class OrderFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="iexact")
    designer_id = filters.NumberFilter(field_name='designer__id', label="Filter by Designer ID")
    date = filters.DateFilter(field_name='created_at', lookup_expr='date')
    class Meta:
        model = Order
        fields = ['status', 'designer_id']


        