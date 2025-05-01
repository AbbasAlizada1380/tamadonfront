from django.urls import path
from .views import OrderCreateView, OrderCheckoutView, OrderListView

urlpatterns = [
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/checkout/', OrderCheckoutView.as_view(), name='order-checkout'),
]
