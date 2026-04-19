from django.db import models
from django.conf import settings

class Recommendations(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recommendations')
    book = models.ForeignKey('books.Book', null=True, blank=True, on_delete=models.SET_NULL, related_name='recommendations')
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    genre = models.CharField(max_length=100)
    tier = models.CharField(max_length=20, blank=True, default="")
    cover_url = models.URLField(blank=True, default="")
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']