from django.urls import path, include
from .views import PlaylistView

urlpatterns = [
    path('book/<uuid:book_id>/playlist/', PlaylistView.as_view()),
]