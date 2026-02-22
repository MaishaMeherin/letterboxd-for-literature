from rest_framework import serializers 
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'
        read_only_fields = ['id', 'avg_rating', 'rating_count', 'created_at']