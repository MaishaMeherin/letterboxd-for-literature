from django.urls import path, include 
from .views import RecommendationsView, RecommendationRefreshView

urlpatterns = [
    path('recommendations/', RecommendationsView.as_view()),
    path('recommendations/refresh/', RecommendationRefreshView.as_view()),
]