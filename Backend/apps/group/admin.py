import csv

import openpyxl
from apps.users.models import User
from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.utils.translation import gettext_lazy as _
from import_export import resources
from import_export.admin import ExportMixin

from .models import Category, Order, ReceptionOrder


# Create a resource for the Order model
class OrderResource(resources.ModelResource):
    designer = resources.Field(attribute="designer", column_name="Designer")
    category = resources.Field(attribute="category", column_name="Category")

    class Meta:
        model = Order
        fields = (
            "order_name",
            "customer_name",
            "designer",
            "category",
            "status",
            "created_at",
            "updated_at",
        )

    def dehydrate_designer(self, order):
        # Use first_name and last_name to represent the designer
        return (
            f"{order.designer.first_name} {order.designer.last_name}"
            if order.designer
            else None
        )

    def dehydrate_category(self, order):
        return order.category.name if order.category else None


# Customizing the admin for Order
class OrderAdmin(ExportMixin, admin.ModelAdmin):
    list_display = (
        "order_name",
        "customer_name",
        "designer",
        "category",
        "secret_key",
        "status",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "order_name",
        "customer_name",
        "designer__first_name",
        "designer__last_name",
    )
    list_filter = ("status", "category", "designer")
    ordering = ("-created_at",)

    resource_class = OrderResource

    # Designer Filter Form
    class DesignerFilterForm(forms.Form):
        designer = forms.ModelChoiceField(
            queryset=User.objects.filter(role=User.Designer),  # Only designers
            required=False,
            label="Select Designer",
        )

    # Custom action for exporting orders based on designer
    def export_orders_by_designer(self, request, queryset):
        designer_id = request.GET.get("designer", None)

        if designer_id:
            queryset = queryset.filter(designer_id=designer_id)

        # Create a CSV response
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            'attachment; filename="orders_by_designer.csv"'
        )
        writer = csv.writer(response)

        # Writing headers
        writer.writerow(
            [
                "Order Name",
                "Customer Name",
                "Designer",
                "Category",
                "Status",
                "Created At",
                "Updated At",
            ]
        )

        # Writing data rows
        for order in queryset:
            writer.writerow(
                [
                    order.order_name,
                    order.customer_name,
                    f"{order.designer.first_name} {order.designer.last_name}",
                    order.category.name,
                    order.status,
                    order.created_at,
                    order.updated_at,
                ]
            )

        return response

    # Custom action for exporting all orders (CSV format)
    def export_all_orders(self, request, queryset):
        # Create a CSV response for all orders
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="all_orders.csv"'
        writer = csv.writer(response)

        # Writing headers
        writer.writerow(
            [
                "Order Name",
                "Customer Name",
                "Designer",
                "Category",
                "Status",
                "Created At",
                "Updated At",
            ]
        )

        # Writing data rows
        for order in queryset:
            writer.writerow(
                [
                    order.order_name,
                    order.customer_name,
                    f"{order.designer.first_name} {order.designer.last_name}",
                    order.category.name,
                    order.status,
                    order.created_at,
                    order.updated_at,
                ]
            )

        return response

    # Custom action for exporting orders to Excel (based on designer)
    def export_orders_by_designer_excel(self, request, queryset):
        designer_id = request.GET.get("designer", None)
        if designer_id:
            queryset = queryset.filter(designer_id=designer_id)

        # Create an Excel response
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = (
            'attachment; filename="orders_by_designer.xlsx"'
        )
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Orders"

        # Writing headers
        headers = [
            "Order Name",
            "Customer Name",
            "Designer",
            "Category",
            "Status",
            "Created At",
            "Updated At",
        ]
        ws.append(headers)

        # Writing data rows
        for order in queryset:
            ws.append(
                [
                    order.order_name,
                    order.customer_name,
                    f"{order.designer.first_name} {order.designer.last_name}",
                    order.category.name,
                    order.status,
                    order.created_at,
                    order.updated_at,
                ]
            )

        wb.save(response)
        return response

    # Custom action for exporting all orders to Excel
    def export_all_orders_excel(self, request, queryset):
        # Create an Excel response for all orders
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="all_orders.xlsx"'

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Orders"

        # Writing headers
        headers = [
            "Order Name",
            "Customer Name",
            "Designer",
            "Category",
            "Status",
            "Created At",
            "Updated At",
        ]
        ws.append(headers)

        # Writing data rows
        for order in queryset:
            ws.append(
                [
                    order.order_name,
                    order.customer_name,
                    f"{order.designer.first_name} {order.designer.last_name}",
                    order.category.name,
                    order.status,
                    order.created_at,
                    order.updated_at,
                ]
            )

        wb.save(response)
        return response

    # Register the custom export actions
    actions = [
        "export_all_orders",
        "export_all_orders_excel",
        "export_orders_by_designer",
        "export_orders_by_designer_excel",
    ]

    # Date Range Form for filtering orders by designer
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["designer_filter_form"] = self.DesignerFilterForm()
        return super().changelist_view(request, extra_context=extra_context)


admin.site.register(Order, OrderAdmin)


class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at", "updated_at")
    search_fields = ("name",)
    ordering = ("-created_at",)
    list_filter = (
        "created_at",
        "updated_at",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )


admin.site.register(Category, CategoryAdmin)
from .models import AttributeType, AttributeValue

admin.site.register(AttributeType)
admin.site.register(AttributeValue)
admin.site.register(ReceptionOrder)
