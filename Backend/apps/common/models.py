import datetime
import uuid

from apps.group.models import Category
from ckeditor_uploader.fields import RichTextUploadingField
from django.db import models
from django.utils.translation import gettext_lazy as _
from pyexpat import model


class TimeStampedUUIDModel(models.Model):
    pkid = models.BigAutoField(primary_key=True, editable=False)
    id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(models.Model):
    name = models.CharField(verbose_name=_("category name"), max_length=255)
    description = RichTextUploadingField()
    image = models.ImageField(upload_to="images/category")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _(" Product Category")
        verbose_name_plural = _("Product Categories")
        ordering = ["-created_at"]


class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to="subcategory/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Product Sub Category")
        verbose_name_plural = _("Product Sub Categories")
        ordering = ["-created_at"]


class Services(models.Model):
    title = models.CharField(max_length=255)
    description = RichTextUploadingField()
    image = models.ImageField(upload_to="services")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title
    class Meta:
        ordering = ["created_at"]

class Images(models.Model):
    images = models.ImageField(upload_to="slider/images", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Hero Slider Image")
        verbose_name_plural = _(" Hero Slider Images")
    def __str__(self):
        return str(self.images.url) if self.images else "No Image"

class GalleryCategory(models.Model):
    name = models.CharField(_("gallery Name"), max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Gallery Category")
        verbose_name_plural = _("Gallery Categories")

    def __str__(self):
        return str(self.name)


class Gallery(models.Model):
    category = models.ForeignKey(
        GalleryCategory, on_delete=models.CASCADE, null=True, blank=True
    )
    image = models.ImageField(_("Gallery Images "), upload_to="gallery/images")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Product Gallery")
        verbose_name_plural = _("Products Galleries")

    def __str__(self):
        return str(self.image.url) if self.image else "No Image"


class AboutModel(models.Model):
    image = models.ImageField(_("About Images "), upload_to="gallery/about")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("About Galleries")
        verbose_name_plural = _("About Galleries")

    def __str__(self):
        return str(self.image.url) if self.image else "No Image"


class CustomerImages(models.Model):
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to="customer_images.")

    def __str__(self):
        return self.name
