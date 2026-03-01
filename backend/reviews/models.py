import uuid
from django.db import models
from django.db.models import Avg
from django.conf import settings

class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE, related_name='reviews')
    reading_log = models.ForeignKey('logs.ReadingLog', on_delete=models.SET_NULL,null=True, blank=True, related_name='review')
    rating = models.DecimalField(max_digits=2, decimal_places=1)   # 1.0–5.0
    text = models.TextField(max_length=10000, blank=True)
    contains_spoilers = models.BooleanField(default=False)
    like_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'book')   # one review per user per book
        ordering = ['-created_at']