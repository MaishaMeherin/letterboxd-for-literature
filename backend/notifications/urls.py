from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet
from django.urls import path


router = DefaultRouter()
router.register('notifications', NotificationViewSet, basename='notification') #basename tell the router what to name the URL patterns

urlpatterns = [path('notifications/read-all/', NotificationViewSet.as_view({'post':'read_all'}), name='notification-read-all'),] + router.urls