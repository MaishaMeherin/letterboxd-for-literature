from django.db import models
from django.conf import settings

class BookPlaylist(models.Model):
    book = models.ForeignKey("books.Book", on_delete=models.CASCADE)
    song = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
   
    #meta tells how to handle at database model, without adding any new fields
    class Meta:
        ordering = ['created_at']
    