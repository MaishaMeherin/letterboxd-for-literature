from django.db import models
from django.conf import settings
import uuid


NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('recommendation_ready', 'Recommendation Ready'),
    ]

# Create your models here
class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications') #review_owner
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications') #sender can be nullable, system notifications have no sender
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES) 
    review = models.ForeignKey('reviews.Review', on_delete=models.SET_NULL, null=True, blank=True) #notification system isn't fully tied to reviews, so it can be null
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    class Meta:
        ordering = ['-created_at']