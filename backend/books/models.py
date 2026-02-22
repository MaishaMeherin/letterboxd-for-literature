import uuid
from django.db import models


class Book(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True)
    authors = models.JSONField(default=list)
    isbn_10 = models.CharField(max_length=10, null=True, blank=True, unique=True)
    isbn_13 = models.CharField(max_length=13, null=True, blank=True, unique=True)
    cover_url = models.URLField(null=True, blank=True)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    publish_date = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    genres = models.JSONField(default=list)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title