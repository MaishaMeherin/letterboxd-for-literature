from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    #frontend needs the name of the user, not just UUID. source='sender.username' traverse the FK and pull .username
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    book_id = serializers.UUIDField(source='review.book_id', read_only=True)
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'sender_username','book_id', 'review', 'is_read', 'created_at']