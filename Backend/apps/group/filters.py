
from django_filters import rest_framework as filters
from .models import Order

class OrderFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="iexact")
    designer_id = filters.NumberFilter(field_name='designer__id', label="Filter by Designer ID")
    class Meta:
        model = Order
        fields = ['status', 'designer_id']


        