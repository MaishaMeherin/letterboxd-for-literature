from rest_framework import serializers
from .models import ReadingLog
from books.serializers import BookSerializer


class ReadingLogSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source='book', read_only=True)

    class Meta:
        model = ReadingLog
        fields = ['id', 'user', 'book', 'book_detail', 'status', 'date_started',
                  'date_finished', 'current_page', 'progress', 'notes',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'progress', 'created_at', 'updated_at']