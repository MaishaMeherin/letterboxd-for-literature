from django.urls import path, include 
from .views import RecommendationsView

urlpatterns = [
    path('recommendations/', RecommendationsView.as_view()),
]