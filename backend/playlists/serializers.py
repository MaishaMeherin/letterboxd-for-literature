from rest_framework import serializers
from .models import BookPlaylist

class BookPlaylistSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookPlaylist
        
        fields = ['id', 'song', 'artist', 'reason', 'created_at']
        read_only_fields = fields #read only fields ignores those fields in incoming requests