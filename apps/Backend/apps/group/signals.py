import jdatetime
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import Order


def generate_secret_key(order_id):
    # Zero pad the order ID to always be 3 digits (001, 002, 003, etc.)
    first_three_digits = str(order_id).zfill(3)

    # Get the current date in the Jalali (Persian) calendar
    current_jalali_date = jdatetime.datetime.now()

    # Extract the last digit of the current Jalali year
    last_digit_of_year = str(current_jalali_date.year)[-1]  # e.g., '4' for 1404

    # Get the current month and day in Jalali calendar
    month_part = current_jalali_date.strftime(
        "%m"
    )  # Two-digit month (e.g., '03' for Farvardin)
    day_part = current_jalali_date.strftime("%d")  # Two-digit day (e.g., '25')

    # Combine all parts to form the secret key
    secret_key = f"{first_three_digits}{last_digit_of_year}{month_part}{day_part}"

    return secret_key


@receiver(pre_save, sender=Order)
def generate_order_secret_key(sender, instance, **kwargs):
    if not instance.secret_key:
        instance.secret_key = generate_secret_key(instance.id)
