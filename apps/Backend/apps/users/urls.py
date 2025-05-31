from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CreateUserView,
    DeleteUserView,
    FalseMessageReadStatusView,
    GetMassages,
    MessageInBox,
    MyTokenObtainPairView,
    PasswordChangeApiView,
    PasswordRegisterEmailVerifyApiView,
    ProfileDetail,
    ProfilePicUpdateView,
    RoleChoicesView,
    SenderMessage,
    SendMessage,
    UpdateMessageReadStatusView,
    UpdateUserView,
    UserProfileView,
    UserViewSet,
    activate_account,
    ContactViewSet,
    UserFreeStatusViewSet

)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register('contact', ContactViewSet)
router.register('free-status', UserFreeStatusViewSet, basename='user-free-status')
urlpatterns = [
    path(
        "profile/<str:user_email>/",
        ProfilePicUpdateView.as_view(),
        name="update-profile-pic",
    ),
    path("user/token/", MyTokenObtainPairView.as_view(), name="token"),
    path("user/token/refresh/", TokenRefreshView.as_view()),
    path("api/", include(router.urls)),
    path(
        "api/create_user/",
        UserViewSet.as_view({"post": "create_user"}),
        name="create_user",
    ),
    path("api/roles/", RoleChoicesView.as_view()),
    path("profiles/", UserProfileView.as_view(), name="user-profile"),
    path("create/", CreateUserView.as_view(), name="create_user"),
    path("activate/<uidb64>/<token>/", activate_account, name="activate_account"),
    path("update/<int:pk>/", UpdateUserView.as_view(), name="update-user"),
    path("delete/<int:pk>/", DeleteUserView.as_view(), name="delete-user"),
    path(
        "user/password-rest-email/<email>/",
        PasswordRegisterEmailVerifyApiView.as_view(),
    ),
    path("user/password-change/", PasswordChangeApiView.as_view()),
    path("message/<user_id>/", MessageInBox.as_view()),
    path("get-message/<sender_id>/<receiver_id>/", GetMassages.as_view()),
    path("send-message/", SendMessage.as_view()),
    path("profile/<int:pk>/", ProfileDetail.as_view()),
    path("message/sender/<int:sender_id>/", SenderMessage.as_view(), name="sender"),
    path(
        "update-message-read-status/",
        UpdateMessageReadStatusView.as_view(),
        name="update-message-read-status",
    ),
    path("unread/", FalseMessageReadStatusView.as_view(), name="unread_messages"),

]
