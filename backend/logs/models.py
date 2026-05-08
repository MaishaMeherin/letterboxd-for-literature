import uuid
from django.db import models
from django.conf import settings


class ReadingLog(models.Model):
    STATUS_CHOICES = [
        ('want_to_read', 'Want to Read'),
        ('reading', 'Currently Reading'),
        ('completed', 'Completed'),
        ('did_not_finish', 'Did Not Finish'),
        ('on_hold', 'On Hold'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reading_logs')
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE, related_name='reading_logs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='want_to_read')
    date_started = models.DateField(null=True, blank=True)
    date_finished = models.DateField(null=True, blank=True)
    current_page = models.PositiveIntegerField(default=0)
    progress = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        from django.utils import timezone
        if self.book.page_count and self.current_page:
            self.progress = (self.current_page / self.book.page_count) * 100
        if self.status == "completed" and self.completed_at is None:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} — {self.book.title} ({self.status})"