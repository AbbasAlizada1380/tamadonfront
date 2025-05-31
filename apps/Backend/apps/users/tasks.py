import datetime
import logging
from io import BytesIO

import requests
from apps.api.models import BlogPost
from apps.api.serializers import BlogPostSerializer
from apps.common.models import Gallery, GalleryCategory, Images, Services
from apps.group.models import Order, ReceptionOrder
from config.celery import app
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.models import Site
from django.core.files import File
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.timezone import now
from PIL import Image

logger = logging.getLogger(__name__)


@app.task
def send_email_notification_task(user_id, email_subject, email_template, link=None):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.get(id=user_id)

    # Get the current site and protocol
    current_site = Site.objects.get_current()
    domain = current_site.domain
    protocol = "https"  # Adjust this as per your setup

    # Generate the uid and token for user
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    # Check if it's a password reset or activation email
    if link is None:
        # Activation email
        activation_link = f"{protocol}://{domain}/users/activate/{uid}/{token}/"
        email_message = render_to_string(
            email_template,
            {
                "user": user,
                "domain": domain,
                "uid": uid,
                "token": token,
                "activation_link": activation_link,
                "current_year": datetime.datetime.now().year,
            },
        )
    else:
        # Password reset email
        email_message = render_to_string(
            email_template,
            {
                "user": user,
                "domain": domain,
                "uid": uid,
                "token": token,
                "link": link,
            },
        )

    # Prepare and send email
    email = EmailMessage(
        subject=email_subject,
        body=email_message,
        to=[user.email],
    )
    email.content_subtype = "html"
    email.send()


@app.task
def process_order_saving(order_id):
    try:
        # Retrieve the order
        order = Order.objects.get(id=order_id)
        print(f"Processing Order ID: {order.id}, Current Status: {order.status}")

        # Perform your task logic here, e.g., updating the order status
        order.status = "processing"  # Update the status (example)
        order.save()  # Save the changes to the database

        # Log after updating the order
        print(f"Order ID: {order.id} status updated to: {order.status}")

        # Optionally, return something to indicate success (useful for debugging)
        return f"Order {order.id} processed successfully with status {order.status}"

    except Order.DoesNotExist:
        print(f"Order with ID {order_id} not found.")
        return f"Order {order_id} not found."


@app.task
def process_order_update(order_id):
    try:
        order = Order.objects.get(id=order_id)
        print(
            f"Processing Update for Order ID: {order.id}, Current Status: {order.status}"
        )

        order.status = "updated"  # or any other status update logic
        order.save()  # Save the updated order

        print(f"Order ID: {order.id} status updated to: {order.status}")

        # You can return something if needed, like a success message
        return f"Order {order.id} updated successfully"

    except Order.DoesNotExist:
        print(f"Order with ID {order_id} not found.")
        return f"Order {order_id} not found."


@app.task
def process_order_deletion(order_id):
    try:
        order = Order.objects.get(id=order_id)
        print(f"Deleting Order ID: {order.id}, Current Status: {order.status}")

        # You can add any post-deletion tasks here, like logging or notifying users
        order.delete()  # If not using the built-in delete, do additional cleanup

        print(f"Order ID: {order.id} has been deleted.")
        return f"Order {order.id} deleted successfully"

    except Order.DoesNotExist:
        print(f"Order with ID {order_id} not found.")
        return f"Order {order_id} not found."


@app.task
def process_reception_order_creation(order_id):
    try:
        order = ReceptionOrder.objects.get(id=order_id)
        print(f"Processing Reception Order Creation for Order ID: {order.id}")

        order.status = "taken"  # Or any other logic
        order.save()

        print(f"Order ID: {order.id} creation processed successfully.")

    except ReceptionOrder.DoesNotExist:
        print(f"Reception Order with ID {order_id} not found.")
        return f"Reception Order {order_id} not found."


# Task for handling background work after order update
@app.task
def process_reception_order_update(order_id):
    try:
        order = ReceptionOrder.objects.get(id=order_id)
        print(f"Processing Reception Order Update for Order ID: {order.id}")

        # Perform background tasks after update (e.g., notify users, update related data)
        order.status = "taken"  # Example update logic
        order.save()

        print(f"Order ID: {order.id} updated successfully.")

    except ReceptionOrder.DoesNotExist:
        print(f"Reception Order with ID {order_id} not found.")
        return f"Reception Order {order_id} not found."


# Task for handling background work after order deletion
@app.task
def process_reception_order_deletion(order_id):
    try:
        order = ReceptionOrder.objects.get(id=order_id)
        print(f"Processing Reception Order Deletion for Order ID: {order.id}")

        # Perform cleanup tasks after deletion (e.g., logging, notify users)
        # You could log the deletion to a file or database
        print(f"Order ID: {order.id} has been deleted.")

        # No need to delete the order again, since it's already deleted from the DB.
        return f"Order {order.id} deleted successfully."

    except ReceptionOrder.DoesNotExist:
        print(f"Reception Order with ID {order_id} not found.")
        return f"Reception Order {order_id} not found."


@app.task
def process_service_creation(service_id):
    try:
        service = Services.objects.get(id=service_id)
        print(f"Processing Service Creation for Service ID: {service.id}")

        print(f"Service ID {service.id} created with title: {service.title}")

        print(f"Service ID {service.id} processed successfully.")

    except Services.DoesNotExist:
        print(f"Service with ID {service_id} not found.")
        return f"Service {service_id} not found."


@app.task
def process_service_update(service_id):
    try:
        service = Services.objects.get(id=service_id)
        print(f"Processing Service Update for Service ID: {service.id}")

        # Perform background tasks after update (e.g., notify users, update related data)
        print(f"Service ID {service.id} updated with new title: {service.title}")

    except Services.DoesNotExist:
        print(f"Service with ID {service_id} not found.")
        return f"Service {service_id} not found."


# Task for handling background work after service deletion
@app.task
def process_service_deletion(service_id):
    try:
        service = Services.objects.get(id=service_id)
        print(f"Processing Service Deletion for Service ID: {service.id}")

        # Perform background tasks before deletion (e.g., logging, cleanup)
        print(f"Service ID {service.id} is being deleted.")

        # Any additional cleanup tasks, if required, can go here.

    except Services.DoesNotExist:
        print(f"Service with ID {service_id} not found.")
        return f"Service {service_id} not found."


@app.task
def delete_image(image_id):
    try:
        image = Images.objects.get(id=image_id)
        image.delete()
        return image_id  # Return the ID of the deleted image
    except Images.DoesNotExist:
        return None


@app.task
def create_or_update_blog_post(data):
    # Get the image URL from the data
    image_url = data.get("image")

    if image_url:
        # If the image URL is relative, make it absolute
        if image_url.startswith("/"):
            image_url = f"{settings.BASE_URL}{image_url}"

        try:
            # Download the image using requests
            response = requests.get(image_url)
            response.raise_for_status()  # Raise exception for 4xx/5xx responses

            # Process the image (save it as a file object)
            image_file = BytesIO(response.content)
            image_file.name = "image.jpg"  # Set the file name for the image
            data["image"] = File(
                image_file, name="image.jpg"
            )  # Attach the file to the data

        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error downloading image: {e}")

    blog_post_data = BlogPostSerializer(data=data)

    if blog_post_data.is_valid():
        blog_post = blog_post_data.save()
        return blog_post.id
    else:
        raise ValueError(f"Invalid data: {blog_post_data.errors}")


@app.task
def delete_blog_post(blog_post_id):
    try:
        blog_post = BlogPost.objects.get(id=blog_post_id)
        blog_post.delete()
        logger.info(f"Blog post with ID {blog_post_id} deleted successfully.")
    except BlogPost.DoesNotExist:
        logger.warning(f"Blog post with ID {blog_post_id} does not exist.")
        return f"Blog post with ID {blog_post_id} does not exist."


@app.task
def process_uploaded_image(image_path):
    try:
        image = Image.open(image_path)
        image = image.resize((800, 800))
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        file_name = image_path.split("/")[-1]
        new_image_path = f"resized_images/{file_name}"
        default_storage.save(new_image_path, ContentFile(buffer.read()))

        print(f"Processed and saved image to {new_image_path}")
    except Exception as e:
        print(f"Error processing image: {e}")


@app.task
def log_create_category(category_id):
    try:
        category = GalleryCategory.objects.get(id=category_id)
        print(f"Category created: {category.name} at {now()}")
    except GalleryCategory.DoesNotExist:
        print(f"Category with ID {category_id} does not exist")


@app.task
def log_create_gallery(gallery_id):
    try:
        gallery = Gallery.objects.get(id=gallery_id)
        print(f"Gallery created: {gallery.id}")
        # Add other logic here, like sending notifications or logging to a file
    except Gallery.DoesNotExist:
        print(f"Gallery with ID {gallery_id} does not exist")


@app.task
def log_delete_category(category_id):
    try:
        category = GalleryCategory.objects.get(id=category_id)
        print(f"Category deleted: {category.name} at {now()}")
    except GalleryCategory.DoesNotExist:
        print(f"Category with ID {category_id} does not exist")


@app.task
def log_create_gallery_task(gallery_id):
    try:
        gallery = Gallery.objects.get(id=gallery_id)
        print(f"Gallery created: {gallery.id} at {now()}")
    except Gallery.DoesNotExist:
        print(f"Gallery with ID {gallery_id} does not exist")


@app.task
def log_update_gallery_task(gallery_id):
    try:
        gallery = Gallery.objects.get(id=gallery_id)
        print(f"Gallery updated: {gallery.id} at {now()}")
    except Gallery.DoesNotExist:
        print(f"Gallery with ID {gallery_id} does not exist")


@app.task
def log_delete_gallery_task(gallery_id):
    try:
        gallery = Gallery.objects.get(id=gallery_id)
        print(f"Gallery deleted: {gallery.id} at {now()}")
    except Gallery.DoesNotExist:
        print(f"Gallery with ID {gallery_id} does not exist")
