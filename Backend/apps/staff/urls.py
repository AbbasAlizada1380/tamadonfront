from django.urls import path

from . import views

urlpatterns = [
    # UpsentModel URLs
    path(
        "upsentmodels/",
        views.UpsentModelListCreateView.as_view(),
        name="upsentmodel-list-create",
    ),
    path(
        "upsentmodels/<int:pk>/",
        views.UpsentModelRetrieveUpdateDestroyView.as_view(),
        name="upsentmodel-detail",
    ),
    # Staff URLs
    path("staff/", views.StaffListCreateView.as_view(), name="staff-list-create"),
    path(
        "staff/<int:pk>/",
        views.StaffRetrieveUpdateDestroyView.as_view(),
        name="staff-detail",
    ),
    path("salaries/", views.SalaryListCreateView.as_view(), name="salary-list-create"),
    path(
        "salaries/<int:pk>/",
        views.SalaryRetrieveUpdateDestroyView.as_view(),
        name="salary-detail",
    ),
]
