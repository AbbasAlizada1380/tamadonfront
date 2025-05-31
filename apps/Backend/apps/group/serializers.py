# --- serializers.py ---

import datetime
from decimal import Decimal
import jdatetime
from django import forms
# from jdatetime import datetime # Careful with name clashes, use jdatetime.datetime
from rest_framework import serializers
from apps.users.models import User # Assuming User model is here
from .models import AttributeType, AttributeValue, Category, Order, ReceptionOrder
from django.contrib.auth import get_user_model # Use this!

# Custom Jalali Date Field (keep as is)
class JalaliDateField(serializers.DateField):
    def to_representation(self, value):
        if value is None:
            return None
        # Handle both date and datetime objects gracefully
        if isinstance(value, datetime.datetime):
            value = value.date()
        elif not isinstance(value, datetime.date):
             return str(value) # Or raise error for unexpected type

        try:
            jalali_date = jdatetime.date.fromgregorian(date=value)
            return jalali_date.strftime("%Y-%m-%d")
        except ValueError:
             # Handle potential errors during conversion
             return str(value) # Fallback or log error

    def to_internal_value(self, data):
        if not data:
            return None
        try:
            # Attempt parsing common Jalali formats
            jalali_dt = jdatetime.datetime.strptime(data, "%Y-%m-%d")
            return jalali_dt.togregorian().date()
        except (ValueError, TypeError):
            try:
                 # Maybe try another format?
                 jalali_dt = jdatetime.datetime.strptime(data, "%Y/%m/%d")
                 return jalali_dt.togregorian().date()
            except (ValueError, TypeError):
                 raise serializers.ValidationError(
                    "Invalid date format. Use YYYY-MM-DD or YYYY/MM/DD."
                )

# Category Serializer (keep as is)
class CategorySerializer(serializers.ModelSerializer):
    stages = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Category
        fields = ["id", "name", "stages", "created_at", "updated_at"]
        ref_name = "GroupCategorySerializer" # Good practice for OpenAPI schema

# Attribute Type Serializer (keep as is)
class AttributeTypeSerializer(serializers.ModelSerializer):
    # Make category representation more readable if needed
    # category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = AttributeType
        fields = [
            "id",
            "name",
            "category", # Keep PK for writing
            # "category_name", # Add if you want readable name on read
            "attribute_type",
            "created_at",
            "updated_at",
        ]

# Attribute Value Serializer (keep as is)
class AttributeValueSerializer(serializers.ModelSerializer):
    # Make attribute representation more readable if needed
    # attribute_name = serializers.CharField(source='attribute.name', read_only=True)

    class Meta:
        model = AttributeValue
        fields = [
            "id",
            "attribute", # Keep PK for writing
            # "attribute_name", # Add if you want readable name on read
            "attribute_value",
            "created_at",
            "updated_at",
        ]

# --- Updated Order Serializer ---
class OrderSerializer(serializers.ModelSerializer):
    # Make related fields more readable in GET requests, but use PK for writing
    designer_details = serializers.SerializerMethodField(read_only=True)
    # category_name = serializers.CharField(source='category.name', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())

    class Meta:
        model = Order
        fields = [
            "id",
            "order_name",
            "customer_name",
            "designer_details",
            "description",
            "category", 
            # "category_id",
            "secret_key",
            "attributes",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "secret_key",
            "created_at",
            "updated_at",
            "designer_details",
            "category_name",
        ]

    def get_designer_details(self, obj):
        if obj.designer:
            full_name = f"{obj.designer.first_name} {obj.designer.last_name}".strip()
            return {
                "id": obj.designer.id,
                "email": obj.designer.email,
                "full_name": full_name if full_name else obj.designer.email # Fallback to email if name is blank
            }
        return None

  

class ReceptionOrderSerializer(serializers.ModelSerializer):
    reminder_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    delivery_date = JalaliDateField(required=False, allow_null=True)
    order_info = serializers.SerializerMethodField(read_only=True)
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), write_only=True)


    class Meta:
        model = ReceptionOrder
        fields = [
            "id",
            "order", # write-only PK
            "order_info", # read-only details
            "price",
            "receive_price",
            "reminder_price", 
            "delivery_date",
            "is_checked",
            "created_at",
        ]
        read_only_fields = ["reminder_price", "created_at", "order_info"]

    def get_order_info(self, obj):
        if obj.order:
            return {
                "id": obj.order.id,
                "secret_key": obj.order.secret_key,
                "order_name": obj.order.order_name,
            }
        return None

    # Validation can focus on business rules not handled by model
    def validate(self, data):
        # Example: Ensure price is not negative if provided
        price = data.get('price', self.instance.price if self.instance else None)
        receive_price = data.get('receive_price', self.instance.receive_price if self.instance else None)

        if price is not None and price < Decimal('0.0'):
             raise serializers.ValidationError({"price": "Price cannot be negative."})
        if receive_price is not None and receive_price < Decimal('0.0'):
             raise serializers.ValidationError({"receive_price": "Receive price cannot be negative."})

        return data

    # No custom create/update needed here if model handles reminder price calculation

# Order Status Update Serializer (keep as is)
class OrderStatusUpdateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    status = serializers.CharField(max_length=255)

    def validate_order_id(self, value):
        if not Order.objects.filter(id=value).exists():
            raise serializers.ValidationError("Order with this ID does not exist.")
        return value

# Simplified Order Serializer for Price context (keep as is)
class OrderSerializerByPrice(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            "id",
            "secret_key", # Include secret key - more useful than ID alone
            "order_name",
            "status",
        ]

# Reception Order Serializer for Price context (keep as is, but use Jalali field)
class ReceptionOrderSerializerByPrice(serializers.ModelSerializer):
    # Use the simplified Order serializer for nested representation
    order = OrderSerializerByPrice(read_only=True)
    # Allow writing order relation via PK
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(), source='order', write_only=True
    )
    delivery_date = JalaliDateField(required=False, allow_null=True)
    reminder_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    ) # Should be read-only

    class Meta:
        model = ReceptionOrder
        fields = [
            "id",
            "order", # Read-only nested details
            "order_id", # Write-only PK
            "price",
            "receive_price",
            "reminder_price", # Read-only
            "delivery_date",
            "is_checked",
            "created_at",
        ]
        read_only_fields = ["reminder_price", "created_at", "order"]

    # No custom create needed if model calculates reminder