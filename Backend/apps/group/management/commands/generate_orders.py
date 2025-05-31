import random

from django.core.management.base import BaseCommand
from faker import Faker

from apps.group.models import Category, Order
from apps.users.models import User


class Command(BaseCommand):
    help = "Generate 100 random Order records"

    def handle(self, *args, **kwargs):
        fake = Faker()

        # Get categories and users to assign them to orders
        categories = Category.objects.all()
        users = User.objects.all()

        # Create 1000 orders
        for _ in range(30):
            order_name = fake.word()  # Random word for order name
            customer_name = fake.name()  # Random name for customer
            description = fake.text()  # Random description text
            designer = random.choice(users)  # Random user for designer
            category = random.choice(categories)  # Random category
            status = random.choice(
<<<<<<< HEAD
                ["Head_of_designers"]
            )  # Random status

            # Create and save the Order instance
=======
                [
                "Delivery" ]
            )
>>>>>>> 7506c2346a0f6097820fcda0198985b178348839
            order = Order(
                order_name=order_name,
                customer_name=customer_name,
                designer=designer,
                description=description,
                category=category,
                status=status,
            )
            order.save()

            # Print out each created order's secret key for tracking
            self.stdout.write(self.style.SUCCESS(f"Order created: {order.secret_key}"))
