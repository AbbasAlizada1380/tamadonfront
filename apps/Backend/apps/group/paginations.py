from rest_framework.pagination import PageNumberPagination

class OrderPagination(PageNumberPagination):
    page_size = 20  # Number of items per page
    page_query_param = "pagenum"  # Custom query parameter name for pagination
