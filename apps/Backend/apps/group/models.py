
import uuid 
from decimal import Decimal 
import jdatetime
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models


User = get_user_model()
class Category(models.Model):
    name = models.CharField(max_length=255)
    stages = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['name']

class AttributeType(models.Model):
    ATTRIBUTE_CHOICE_TYPE = (
        ("dropdown", "dropdown"),
        ("date", "date"),
        ("checkbox", "checkbox"),
        ("input", "input"),
    )
    name = models.CharField(max_length=50)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="attribute_types"
    )
    attribute_type = models.CharField(
        max_length=100, choices=ATTRIBUTE_CHOICE_TYPE, default="select attribute type"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    def clean(self):
        existing = AttributeType.objects.filter(
            name=self.name, category=self.category
        ).exclude(pk=self.pk)
        if existing.exists():
            raise ValidationError(
                f"An attribute with the name '{self.name}' already exists in the category '{self.category.name}'."
            )
        super().clean()

    class Meta:
        unique_together = ["name", "category"]
        ordering = ['category', 'name']

class AttributeValue(models.Model):
    attribute = models.ForeignKey(
        AttributeType,
        on_delete=models.CASCADE,
        related_name="attribute_values",
    )
    attribute_value = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        attr_name = self.attribute.name if self.attribute else "N/A"
        return f"{self.attribute_value} (for {attr_name})"
    def clean(self):
        existing = AttributeValue.objects.filter(
            attribute=self.attribute, attribute_value=self.attribute_value
        ).exclude(pk=self.pk)
        if existing.exists():
            attr_name = self.attribute.name if self.attribute else "N/A"
            raise ValidationError(
                f"An attribute value '{self.attribute_value}' already exists for the attribute '{attr_name}'."
            )
        super().clean()

    class Meta:
        unique_together = ["attribute", "attribute_value"]
        ordering = ['attribute', 'attribute_value']

def generate_secret_key_based_on_id(order_id):
    """Generates a secret key based on order ID and current Jalali date."""
    if not order_id:
        return None
    try:
        current_jalali_date = jdatetime.datetime.now()
        last_digit_of_year = str(current_jalali_date.year)[-1]
        month_part = current_jalali_date.strftime("%m")
        day_part = current_jalali_date.strftime("%d")
        first_three_digits = str(order_id).zfill(3)
        secret_key = f"{first_three_digits}{last_digit_of_year}{month_part}{day_part}"

        temp_key = secret_key
        counter = 1
        while Order.objects.filter(secret_key=temp_key).exists():
            temp_key = f"{secret_key[:3]}{str(int(secret_key[3:]) + counter)[-3:]}"
            counter += 1
            if counter > 20: 
                 print(f"ERROR: Could not generate unique secret key for order ID {order_id} after multiple attempts.")
                 return None 
        return temp_key
    except Exception as e:
        print(f"ERROR generating secret key for order ID {order_id}: {e}")
        return None


class Order(models.Model):
    order_name = models.CharField(max_length=255)
    customer_name = models.CharField(max_length=255)
    designer = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="designed_orders", null=True, blank=True)
    description = models.TextField(blank=True)
    secret_key = models.CharField(
        max_length=40, 
        editable=False,
        unique=True,
    )
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    status = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    attributes = models.JSONField(default=dict, null=True, blank=True)

    def __str__(self):
        display_key = self.secret_key if self.secret_key and 'temp-' not in self.secret_key else f"ID:{self.pk}"
        return f"Order {display_key}: {self.order_name} by {self.customer_name}"

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        is_creating = self._state.adding
        if is_creating and not self.secret_key:
            temp_key = f"temp-{uuid.uuid4().hex[:12]}" 
            self.secret_key = temp_key

            super().save(*args, **kwargs)

            final_key = generate_secret_key_based_on_id(self.id)

            if final_key:
                self.secret_key = final_key
                Order.objects.filter(pk=self.pk).update(secret_key=final_key)
            else:
                print(f"Warning: Final secret key generation failed for Order ID {self.id}. Record saved with temp key: {temp_key}")
        else:
             super().save(*args, **kwargs)


class ReceptionOrder(models.Model):
    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name="reception_details"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    receive_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    reminder_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'), editable=False
    )
    delivery_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_checked = models.BooleanField(default=False)

    def calculate_reminder(self):
        price = self.price if self.price is not None else Decimal('0.0')
        received = self.receive_price if self.receive_price is not None else Decimal('0.0')
        return price - received

    def clean(self):
        if self.price is not None and self.receive_price is not None:
            if self.receive_price > self.price:
                raise ValidationError({"receive_price": "Received price cannot be greater than the total price."})
        super().clean()

    def save(self, *args, **kwargs):
        self.reminder_price = self.calculate_reminder()
        super().save(*args, **kwargs)

    def __str__(self):
        order_display = "N/A"
        if self.order:
             order_display = self.order.secret_key if self.order.secret_key and 'temp-' not in self.order.secret_key else f"ID:{self.order.pk}"
        return f"Reception for Order {order_display} - Price: {self.price}"

    class Meta:
         ordering = ['-created_at']