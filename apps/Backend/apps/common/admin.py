from django.contrib import admin

from .models import AboutModel, Category, Gallery, GalleryCategory, CustomerImages, Images, SubCategory

admin.site.register(Images)
admin.site.register(GalleryCategory)
admin.site.register(Gallery)
admin.site.register(Category)

admin.site.register(SubCategory)
admin.site.register(AboutModel)
admin.site.register(CustomerImages)
