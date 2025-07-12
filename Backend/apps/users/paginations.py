from rest_framework.pagination import PageNumberPagination

class UserPagination(PageNumberPagination):
    page_size = 10  # Number of items per page
    page_query_param = "pagenum"  # Custom query parameter name for pagination
