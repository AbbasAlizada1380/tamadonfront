from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from networkx import pappus_graph
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="Tamadon MIS system Backend APIs",
        default_version="v1",
        description=(
            "This is the API documentation for TESOl LMS project APIs.\n\n"
            "Contacts:\n"
            "- Ali Sina Sultani: alisinasultani@gmail.com\n"
            "- Abbas Alizadah: abbas.alizadah1380@gmail.com \n"
            "- Anwar Mohammadi : anwarmohammadi1390@gmail.com \n"
            "- Hussain Mohammadi: aukto1390@gmail.com and pushking1390@gmail"
        ),
        contact=openapi.Contact(email="alisinasultani@gmail.com"),
        license=openapi.License(name="MIT"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


urlpatterns = [
    path(
        "swagger<format>/", schema_view.without_ui(cache_timeout=0), name="schema-json"
    ),
    path("", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path(settings.ADMIN_URL, admin.site.urls),
    # path("api/auth/", include("djoser.urls.authtoken")),
    path("reception/", include("apps.api.urls")),
    path("users/", include("apps.users.urls")),
    path("common/", include("apps.common.urls")),
    path("group/", include("apps.group.urls")),
    path("ordering", include("apps.order.urls")),
    path("staff", include("apps.staff.urls")),
    path("ckeditor/", include("ckeditor_uploader.urls")),
]
admin.site.site_header = "Tamadon Admin"
admin.site.site_title = "Tamando Admin Area."
admin.site.index_title = "Welcome to the Tamando administration "
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
