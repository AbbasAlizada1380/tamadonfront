# apps/group/urls.py

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AttributeTypeDetailView,
    AttributeTypeListCreateView,
    AttributeValueDetailView,
    AttributeValueListCreateView,
    CategoryAttributeView,
    CategoryCreateView,
    CategoryUpdateView,
    OrderListByCategoryView,
    OrderListView,
    OrderStatusDetailView,
    OrderStatusRoleViewSet,
    OrderStatusUpdateView,
    OrderViewSet,
    ReceptionListOldOrdersView,
    ReceptionOrderByPriceViewSet,
    ReceptionOrderViewSet,
    ReceptionTodayNonReceptionOrdersViewSet,
    SuperDesignerReceptionOrdersViewSet,
    UpdateReminderPriceView,
)

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
router.register("reception-orders", ReceptionOrderViewSet, basename="receptionorder")
router.register(
    "group/orders/status_supper",
    SuperDesignerReceptionOrdersViewSet,
    basename="superdesigner-reception-orders",
)
router.register(
    "order-by-price", ReceptionOrderByPriceViewSet, basename="receptionorder-by-price"
)
router.register(
    "orders/status_list/(?P<status>[^/.]+)",
    OrderStatusRoleViewSet,
    basename="order-status-role",
)
reception_today_router = DefaultRouter()
reception_today_router.register(
    "orders/reception_list/today",
    ReceptionTodayNonReceptionOrdersViewSet,
    basename="reception-today-nonreception-orders",
)


urlpatterns = [
    path(
        "orders/today/<int:pk>/",
        OrderViewSet.as_view(
            {
                "get": "retrieve_today",
                "put": "update_today",
                "patch": "partial_update_today",
                "delete": "destroy_today",
            }
        ),
        name="order-today-detail",
    ),
    path(
        "orders/status/<str:status>/<int:pk>/",
        OrderStatusDetailView.as_view(),
        name="order-status-detail",
    ),
    path("categories/", CategoryCreateView.as_view(), name="category-list-create"),
    path(
        "categories/<int:pk>/",
        CategoryUpdateView.as_view(),
        name="category-detail-update-destroy",
    ),
    path(
        "attribute-values/",
        AttributeValueListCreateView.as_view(),
        name="attribute-value-list-create",
    ),
    path(
        "attribute-values/<int:pk>/",
        AttributeValueDetailView.as_view(),
        name="attribute-value-detail",
    ),
    path(
        "attribute-types/",
        AttributeTypeListCreateView.as_view(),
        name="attribute-type-list-create",
    ),
    path(
        "attribute-types/<int:pk>/",
        AttributeTypeDetailView.as_view(),
        name="attribute-type-detail",
    ),
    path(
        "categories/<int:category_id>/attributes/",
        CategoryAttributeView.as_view(),
        name="category-attributes",
    ),
    path(
        "orders/status/<str:status>/",
        OrderListView.as_view(),
        name="order-list-by-status",
    ),
    path(
        "orders/category/<int:category_id>/",
        OrderListByCategoryView.as_view(),
        name="order-list-by-category",
    ),
    path(
        "orders/update-status/",
        OrderStatusUpdateView.as_view(),
        name="order-update-status",
    ),
    path(
        "order-by-price/complete/<int:order_id>/",
        UpdateReminderPriceView.as_view(),
        name="update-reminder-price",
    ),
    path("", include(router.urls)),
    path(
        "group/orders/reception_list/",
        ReceptionListOldOrdersView.as_view(),
        name="reception-old-orders-list",
    ),
    path("", include(reception_today_router.urls)),
]
