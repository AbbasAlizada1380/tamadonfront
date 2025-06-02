# apps/group/views.py

import csv
import uuid
from decimal import Decimal

from apps.group.filters import OrderFilter
from apps.group.paginations import OrderPagination
from apps.group.permissions import IsSuperDesignerOrReception
from apps.users.models import User
from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AttributeType, AttributeValue, Category, Order, ReceptionOrder
from .serializers import (
    AttributeTypeSerializer,
    AttributeValueSerializer,
    CategorySerializer,
    JalaliDateField,
    OrderSerializer,
    OrderSerializerByPrice,
    OrderStatusUpdateSerializer,
    ReceptionOrderSerializer,
    ReceptionOrderSerializerByPrice,
)

User = get_user_model()


class CategoryCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        category_type = self.request.query_params.get("category_list")

        if category_type is not None:
            if category_type in dict(Category.CategoryList.choices):
                return Category.objects.filter(category_list=category_type)
            else:
                return Category.objects.none()
        return Category.objects.all()


class CategoryUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class CategoryDeleteView(generics.DestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class AttributeValueListCreateView(generics.ListCreateAPIView):
    queryset = AttributeValue.objects.select_related("attribute").all()
    serializer_class = AttributeValueSerializer
    permission_classes = [AllowAny]


class AttributeValueDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AttributeValue.objects.select_related("attribute").all()
    serializer_class = AttributeValueSerializer
    permission_classes = [AllowAny]


class AttributeTypeListCreateView(generics.ListCreateAPIView):
    queryset = AttributeType.objects.select_related("category").all()
    serializer_class = AttributeTypeSerializer
    permission_classes = [AllowAny]


class AttributeTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AttributeType.objects.select_related("category").all()
    serializer_class = AttributeTypeSerializer
    permission_classes = [AllowAny]


class CategoryAttributeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, category_id):
        try:
            category = Category.objects.prefetch_related(
                "attribute_types__attribute_values"
            ).get(id=category_id)
        except Category.DoesNotExist:
            raise NotFound(detail="Category not found")
        attribute_types = category.attribute_types.all()

        attribute_values = AttributeValue.objects.filter(attribute__in=attribute_types)
        attribute_type_serializer = AttributeTypeSerializer(attribute_types, many=True)

        attribute_value_serializer = AttributeValueSerializer(
            attribute_values, many=True
        )
        response_data = {
            "category_id": category.id,
            "category_name": category.name,
            "attribute_types": attribute_type_serializer.data,
            "attribute_values": attribute_value_serializer.data,
        }
        return Response(response_data, status=status.HTTP_200_OK)


class OrderViewSet(viewsets.ModelViewSet):
    """
    EXISTING: API endpoint for Orders. Handles /orders/, /orders/{pk}/, etc.
    (Logic Unchanged by new requirements)
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = OrderFilter
    search_fields = ["secret_key", "order_name", "customer_name"]
    pagination_class = OrderPagination

    def _get_base_queryset_for_user(self):
        user = self.request.user
        base_queryset = Order.objects.select_related("designer", "category")

        admin_role = getattr(User, "Admin", 0)
        designer_role = getattr(User, "Designer", 1)
        super_designer_role = getattr(User, "SuperDesigner", 3)

        admin_roles_see_all = [admin_role]
        designer_roles_see_own = [designer_role, super_designer_role]
        user_role = getattr(user, "role", None)

        if user.is_admin or (
            user_role is not None and user_role in admin_roles_see_all
        ):
            queryset = base_queryset.all()
        elif user_role is not None and user_role in designer_roles_see_own:
            queryset = base_queryset.filter(designer=user)
        else:
            queryset = base_queryset.none()
        return queryset

    def get_queryset(self):
        """Default queryset excludes today's orders, applying role filters."""
        queryset = self._get_base_queryset_for_user()
        today = timezone.now().date()
        queryset = queryset.exclude(created_at__date=today)
        return queryset.order_by("-created_at")

    @action(detail=False, methods=["get"], url_path="today", url_name="today-list")
    def today_orders_list(self, request, *args, **kwargs):
        """Custom action to list only orders created today, applying role filters."""
        queryset = self._get_base_queryset_for_user()
        today = timezone.now().date()
        queryset = queryset.filter(created_at__date=today)
        queryset = self.filter_queryset(queryset)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_object_today(self):
        """Helper to get an order by PK, verifying it belongs to today and user has base permissions."""
        pk = self.kwargs.get("pk")
        base_qs = self._get_base_queryset_for_user()
        try:
            obj = get_object_or_404(base_qs, pk=pk)
        except Http404:
            raise NotFound(detail=f"Order {pk} not found or permission denied.")

        today = timezone.now().date()
        if obj.created_at.date() != today:
            raise NotFound(detail=f"Order {pk} was not created today.")

        self.check_object_permissions(self.request, obj)
        return obj

    def retrieve_today(self, request, *args, **kwargs):
        """Handles GET /orders/today/{pk}/"""
        instance = self.get_object_today()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update_today(self, request, *args, **kwargs):
        """Handles PUT /orders/today/{pk}/"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object_today()
        user = request.user

        if not (
            user.is_admin
            or getattr(user, "role", None) == User.Admin
            or instance.designer == user
        ):
            raise PermissionDenied("You do not have permission to update this order.")

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}
        return Response(serializer.data)

    def partial_update_today(self, request, *args, **kwargs):
        """Handles PATCH /orders/today/{pk}/"""
        kwargs["partial"] = True
        return self.update_today(request, *args, **kwargs)

    def destroy_today(self, request, *args, **kwargs):
        """Handles DELETE /orders/today/{pk}/"""
        instance = self.get_object_today()
        user = request.user

        if not (
            user.is_admin
            or getattr(user, "role", None) == User.Admin
            or instance.designer == user
        ):
            raise PermissionDenied("You do not have permission to delete this order.")

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        """Logic for creating orders via the main /orders/ endpoint"""
        user = self.request.user

        allowed_roles = [User.Designer, User.SuperDesigner, User.Admin]
        if not (user.is_admin or getattr(user, "role", None) in allowed_roles):
            raise PermissionDenied(
                "You do not have permission to create orders via this endpoint."
            )

        if getattr(user, "role", None) in [User.Designer, User.SuperDesigner]:
            serializer.save(designer=user)
        else:

            serializer.save()

    def perform_update(self, serializer):

        serializer.save()

    def perform_destroy(self, instance):

        instance.delete()


class OrderListView(generics.ListAPIView):
    """EXISTING: Read-only list view for Orders filtered ONLY by status from URL path."""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = OrderFilter
    search_fields = ["secret_key", "order_name", "customer_name"]
    pagination_class = OrderPagination

    def get_queryset(self):

        queryset = Order.objects.select_related("designer", "category")
        status_param = self.kwargs.get("status")
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)

        user = self.request.user
        admin_role = getattr(User, "Admin", 0)
        designer_role = getattr(User, "Designer", 1)
        super_designer_role = getattr(User, "SuperDesigner", 3)
        user_role = getattr(user, "role", None)
        is_admin_user = user.is_admin or (user_role == admin_role)
        is_designer = user_role in [designer_role, super_designer_role]

        if is_admin_user:

            pass
        elif is_designer:

            queryset = queryset.filter(designer=user)
        else:

            queryset = queryset.none()

        return queryset.order_by("-created_at")


class OrderStatusDetailView(generics.RetrieveUpdateDestroyAPIView):
    """EXISTING: Handles GET/PUT/PATCH/DELETE for /group/orders/status/<status>/<pk>/."""

    queryset = Order.objects.select_related("designer", "category").all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_object(self):
        """Checks status match from URL and applies role-based permissions."""
        pk = self.kwargs.get(self.lookup_field)
        status_from_url = self.kwargs.get("status")
        if not pk or not status_from_url:
            raise Http404("Missing primary key or status in URL.")

        obj = get_object_or_404(self.get_queryset(), pk=pk)

        if obj.status.lower() != status_from_url.lower():
            raise NotFound(
                detail=f"Order {pk} does not currently have status '{status_from_url}'."
            )

        self.check_object_permissions(self.request, obj)

        user = self.request.user
        user_role = getattr(user, "role", None)

        is_admin = user.is_admin or (user_role == User.Admin)
        is_order_designer = obj.designer == user
        allowed_general_roles = [User.Designer, User.Reception, User.SuperDesigner]
        has_allowed_role = user_role is not None and user_role in allowed_general_roles

        if not (is_admin or is_order_designer or has_allowed_role):
            raise PermissionDenied(
                "You do not have permission to access this order via this status URL."
            )

        return obj


class OrderListByCategoryView(generics.ListAPIView):
    """EXISTING: Read-only list view for Orders filtered by category_id from URL path."""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OrderPagination

    def get_queryset(self):
        category_id = self.kwargs.get("category_id")
        if not category_id:
            return Order.objects.none()
        try:
            category_id = int(category_id)

            if not Category.objects.filter(id=category_id).exists():
                raise NotFound(f"Category with ID {category_id} not found.")
            base_queryset = Order.objects.select_related("designer", "category").filter(
                category_id=category_id
            )
        except (ValueError, TypeError):
            raise DRFValidationError({"category_id": "Invalid category ID."})

        user = self.request.user
        admin_role = getattr(User, "Admin", 0)
        designer_role = getattr(User, "Designer", 1)
        super_designer_role = getattr(User, "SuperDesigner", 3)
        user_role = getattr(user, "role", None)
        is_admin_user = user.is_admin or (user_role == admin_role)
        is_designer = user_role in [designer_role, super_designer_role]

        if is_admin_user:
            queryset = base_queryset
        elif is_designer:
            queryset = base_queryset.filter(designer=user)
        else:

            queryset = base_queryset.none()

        return queryset.order_by("-created_at")


class OrderStatusUpdateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrderStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            order_id = serializer.validated_data["order_id"]
            status_value = serializer.validated_data["status"]
            order = Order.objects.get(id=order_id)
            order.status = status_value
            order.save()

            return Response(
                {"message": "Order status updated successfully."},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReceptionOrderViewSet(viewsets.ModelViewSet):
    """EXISTING: API endpoint for ReceptionOrder records."""

    serializer_class = ReceptionOrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OrderPagination

    def get_queryset(self):
        queryset = ReceptionOrder.objects.select_related(
            "order", "order__designer", "order__category"
        ).all()
        order_id_param = self.request.query_params.get("order", None)
        if order_id_param:
            try:
                order_id = int(order_id_param)
                queryset = queryset.filter(order_id=order_id)
            except (ValueError, TypeError):
                raise DRFValidationError({"order": "Invalid order ID provided."})

        user = self.request.user
        user_role = getattr(user, "role", None)
        admin_role = getattr(User, "Admin", 0)
        reception_role = getattr(User, "Reception", 2)
        designer_role = getattr(User, "Designer", 1)
        super_designer_role = getattr(User, "SuperDesigner", 3)
        admin_or_reception_roles = [admin_role, reception_role]
        designer_roles_see_own_order = [designer_role, super_designer_role]
        is_admin_or_reception = user.is_admin or (
            user_role is not None and user_role in admin_or_reception_roles
        )

        if is_admin_or_reception:
            pass
        elif user_role is not None and user_role in designer_roles_see_own_order:
            queryset = queryset.filter(order__designer=user)
        else:
            queryset = queryset.none()

        return queryset.order_by("-created_at")

    def _check_reception_crud_permission(self, request):
        """Checks if user is Admin or Reception."""
        user = request.user
        user_role = getattr(user, "role", None)
        allowed_roles = [User.Admin, User.Reception]
        if not (
            user.is_admin or (user_role is not None and user_role in allowed_roles)
        ):
            raise PermissionDenied(
                "Admin or Reception role required to modify reception details."
            )

    def perform_create(self, serializer):
        """Checks Admin/Reception permission before creating."""
        self._check_reception_crud_permission(self.request)

        order_instance = serializer.validated_data.get("order")
        if (
            order_instance
            and ReceptionOrder.objects.filter(order=order_instance).exists()
        ):
            raise DRFValidationError(
                {
                    "order": f"Reception details already exist for Order ID {order_instance.id}."
                }
            )
        serializer.save()

    def perform_update(self, serializer):
        """Checks Admin/Reception permission before updating."""
        self._check_reception_crud_permission(self.request)
        serializer.save()

    def perform_destroy(self, instance):
        """Checks Admin/Reception permission before deleting."""
        self._check_reception_crud_permission(self.request)
        instance.delete()


class ReceptionOrderByPriceViewSet(viewsets.ModelViewSet):
    """EXISTING: API endpoint for ReceptionOrder using price serializer."""

    queryset = ReceptionOrder.objects.select_related(
        "order", "order__designer", "order__category"
    ).all()
    serializer_class = ReceptionOrderSerializerByPrice
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["order", "price", "receive_price", "is_checked"]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by("-created_at")
        user = self.request.user
        user_role = getattr(user, "role", None)
        admin_role = getattr(User, "Admin", 0)
        reception_role = getattr(User, "Reception", 2)
        designer_role = getattr(User, "Designer", 1)
        super_designer_role = getattr(User, "SuperDesigner", 3)
        admin_or_reception_roles = [admin_role, reception_role]
        designer_roles_see_own_order = [designer_role, super_designer_role]
        is_admin_or_reception = user.is_admin or (
            user_role is not None and user_role in admin_or_reception_roles
        )
        if is_admin_or_reception:
            pass
        elif user_role is not None and user_role in designer_roles_see_own_order:
            queryset = queryset.filter(order__designer=user)
        else:
            queryset = queryset.none()
        return queryset.order_by("-created_at")

    def _check_reception_crud_permission(self, request):
        """Checks if user is Admin or Reception."""
        user = request.user
        user_role = getattr(user, "role", None)
        allowed_roles = [User.Admin, User.Reception]
        if not (
            user.is_admin or (user_role is not None and user_role in allowed_roles)
        ):
            raise PermissionDenied("Admin or Reception role required.")

    def perform_create(self, serializer):
        """Checks Admin/Reception permission. Handles order_id from serializer."""
        self._check_reception_crud_permission(self.request)

        order_instance = serializer.validated_data.get("order")
        if (
            order_instance
            and ReceptionOrder.objects.filter(order=order_instance).exists()
        ):
            raise DRFValidationError(
                {
                    "order": f"Reception details already exist for Order ID {order_instance.id}."
                }
            )
        serializer.save()


class UpdateReminderPriceView(APIView):
    def post(self, request, order_id):
        try:
            reception_order = ReceptionOrder.objects.get(order_id=order_id)
        except ReceptionOrder.DoesNotExist:
            raise NotFound(detail="ReceptionOrder not found for this order_id.")

        if (
            reception_order.price is not None
            and reception_order.receive_price is not None
        ):

            reception_order.receive_price += reception_order.reminder_price
            reception_order.reminder_price = 0

            reception_order.save()

            if reception_order.receive_price == reception_order.price:
                message = "Price is completed receive"
            else:
                message = "Price is not fully received yet"

            return Response(
                {
                    "order_id": reception_order.order_id,
                    "reminder_price": reception_order.reminder_price,
                    "receive_price": reception_order.receive_price,
                    "message": message,
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"detail": "Price and receive price must not be null."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ReceptionListOldOrdersView(generics.ListAPIView):
    """
    NEW: Endpoint for Reception role (role=2) to list orders that were
    NOT created today AND whose status is NOT 'Reception'. Read-only.
    URL: /group/orders/reception_list/
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OrderPagination
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ["secret_key", "order_name", "customer_name"]

    def get_queryset(self):
        user = self.request.user

        reception_role_id = User.Reception

        if getattr(user, "role", None) != reception_role_id:
            return Order.objects.none()

        today = timezone.now().date()
        queryset = (
            Order.objects.exclude(created_at__date=today)
            .exclude(status__iexact="Reception")
            .select_related("designer", "category")
            .order_by("-created_at")
        )

        return queryset


class ReceptionTodayNonReceptionOrdersViewSet(viewsets.ModelViewSet):
    """
    NEW: Endpoint for Reception role (role=2) to perform CRUD operations
    on orders created TODAY that DO NOT have status='Reception'.
    URL: /group/orders/reception_list/today/ (list/create)
         /group/orders/reception_list/today/{pk}/ (retrieve/update/delete)
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OrderPagination
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ["secret_key", "order_name", "customer_name"]
    filterset_fields = ["category", "designer"]

    def get_queryset(self):
        """Filters for today's orders excluding 'Reception' status, for Reception role."""
        user = self.request.user
        reception_role_id = User.Reception

        if getattr(user, "role", None) != reception_role_id:
            return Order.objects.none()

        today = timezone.now().date()
        queryset = (
            Order.objects.filter(created_at__date=today)
            .exclude(status__iexact="Reception")
            .select_related("designer", "category")
            .order_by("-created_at")
        )

        return queryset

    def check_permissions(self, request):
        """Explicitly check for Reception role for ALL actions on this ViewSet."""
        super().check_permissions(request)
        user = request.user
        reception_role_id = User.Reception
        if getattr(user, "role", None) != reception_role_id:

            self.permission_denied(
                request,
                message="You must have the Reception role to perform this action.",
            )

    def check_object_permissions(self, request, obj):
        """
        Check Reception role again for object-level actions and ensure
        the object still meets the view's criteria (today, not 'Reception').
        """
        super().check_object_permissions(request, obj)

        user = request.user
        reception_role_id = User.Reception

        if getattr(user, "role", None) != reception_role_id:
            self.permission_denied(
                request,
                message="You must have the Reception role to access this object.",
            )

        today = timezone.now().date()
        if obj.created_at.date() != today or obj.status.lower() == "reception":
            raise NotFound(
                "This order does not match the criteria for this endpoint "
                "(must be created today and status not 'Reception')."
            )


class SuperDesignerReceptionOrdersViewSet(viewsets.ModelViewSet):
    """
    API endpoint for SuperDesigners (role=3) AND Reception (role=2) users
    to manage Orders with status="Reception".

    Allows Listing, Retrieving, Updating, and Deleting these specific orders.
    Creation (POST) is disallowed via this endpoint.
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsSuperDesignerOrReception]
    pagination_class = OrderPagination
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ["secret_key", "order_name", "customer_name"]

    http_method_names = ["get", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        """
        Returns a queryset containing only Orders with status 'Reception'.
        Permission class ensures only SuperDesigners or Reception users access this.
        """
        queryset = (
            Order.objects.filter(status__iexact="Reception")
            .select_related("designer", "category")
            .order_by("-created_at")
        )
        return queryset


class OrderStatusRoleViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]
    pagination_class = OrderPagination
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ["secret_key", "order_name", "customer_name"]
    filterset_class = OrderFilter
    lookup_field = "pk"
    http_method_names = ["get", "put", "patch", "delete", "head", "options"]

    # def _get_user_role_display_name(self, user):
    #     """Helper to safely get the role's display name."""
    #     if not hasattr(user, 'role') or user.role is None:
    #         return None
    #     try:
    #         return user.get_role_display()
    #     except AttributeError:
    #          print(f"Warning: Could not get role display name for user {user.id}")
    #          for role_int, role_name in User.ROLE_CHOICES:
    #              if role_int == user.role:
    #                  return role_name
    #          return None

    # def _user_can_access_status_url(self, user, status_from_url):
    #     """Checks if the user's role permits accessing this specific status URL."""
    #     if not status_from_url:
    #         return False

    #     user_role_int = getattr(user, 'role', None)
    #     is_admin = user.is_admin or user_role_int == User.Admin
    #     is_super_designer = user_role_int == User.SuperDesigner

    #     if is_admin or is_super_designer:
    #         return True

    #     user_role_name = self._get_user_role_display_name(user)
    #     if user_role_name and user_role_name.lower() == status_from_url.lower():
    #         return True

    #     return False
    def get_queryset(self):
        """
        Filters the queryset by the 'status' value from the URL.
        """
        status_from_url = self.kwargs.get("status")  # e.g., "Completed"

        if not status_from_url:
            return Order.objects.none()

        return (
            Order.objects.filter(status__iexact=status_from_url)
            .select_related("designer", "category")
            .order_by("-created_at")
        )

    def check_object_permissions(self, request, obj):
        """
        Checks permissions for RETRIEVE, UPDATE, DELETE actions on a specific object.
        This runs *after* the object is fetched.
        """
        super().check_object_permissions(request, obj)

        user = request.user
        status_from_url = self.kwargs.get("status")

        # --- Sanity Checks ---
        if not status_from_url or obj.status.lower() != status_from_url.lower():
            raise NotFound(f"Order {obj.pk} not found with status '{status_from_url}'.")

        if not self._user_can_access_status_url(user, status_from_url):
            # This should ideally not be hit if list view was used, but protects direct URL access
            raise PermissionDenied(
                f"You do not have permission to access orders with status '{status_from_url}'."
            )

        if request.method in ("PUT", "PATCH", "DELETE"):
            user_role_int = getattr(user, "role", None)
            is_admin = user.is_admin or user_role_int == User.Admin
            is_super_designer = user_role_int == User.SuperDesigner

            if is_admin or is_super_designer:
                return True

            user_role_name = self._get_user_role_display_name(user)
            if not (user_role_name and user_role_name.lower() == obj.status.lower()):
                raise PermissionDenied(
                    "You can only modify or delete this order if your role currently "
                    f"matches the order's status ('{obj.status}'), or if you are an Admin/SuperDesigner."
                )
            return True

        return True
