from rest_framework import serializers
from .models import Recommendations

class RecommendationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendations
         
        fields = ['id', 'book', 'title', 'author', 'genre', 'tier', 'cover_url', 'user', 'reason', 'created_at']
        read_only_fields = fields