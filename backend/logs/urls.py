from django.urls import path, include 
from rest_framework.routers import DefaultRouter
from .views import ReadingLogViewSet

router = DefaultRouter()
router.register(r'logs', ReadingLogViewSet, basename='readinglog')

urlpatterns = [
    path('', include(router.urls))
]

