import uuid
from django.db import models


class Book(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    google_books_id = models.CharField(max_length=20, null=True, blank=True)
    goodreads_id = models.CharField(max_length=20, null=True, blank=True)
    goodreads_url = models.URLField(null=True, blank=True)
    scraped = models.BooleanField(default=False)
    scraped_at = models.DateTimeField(null=True, blank=True)
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
    
    
class BookShelfTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='shelf_tags')
    tag = models.CharField(max_length=100)
    mention_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
          return f"{self.tag} ({self.book.title})"
      
class CommunitySong(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='community_songs')
    artist_name = models.CharField(max_length=255)
    song_title = models.CharField(max_length=255, null=True, blank=True)
    mention_count = models.IntegerField(default=0)
    spotify_verified = models.BooleanField(default=False)
    raw_mention = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.artist_name} — {self.book.title}"