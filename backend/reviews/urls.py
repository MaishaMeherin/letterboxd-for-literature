from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, ReviewCommentViewSet

router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'comments', ReviewCommentViewSet, basename='comment')


urlpatterns = [
    path('', include(router.urls)),
]
