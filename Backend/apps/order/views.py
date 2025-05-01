from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from .serializers import OrderSerializer
from . models import OrderSystem, Order

order_system = OrderSystem()

class OrderCreateView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request, *args, **kwargs):
        order = order_system.create_order()
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class OrderCheckoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        order_id = request.data.get("order_id")
        order = order_system.complete_order(order_id)
        
        if order:
            # After completing the order, check if any waiting orders need assignment
            order_system.user_available()

            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
 
 
class OrderListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        orders = Order.objects.all()
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
