from rest_framework import serializers
from .models import Review, ReviewLike, ReviewComment


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'username', 'book', 'book_title', 'reading_log','rating', 'text', 'contains_spoilers', 'like_count', 'liked_by_user', 'comment_count', 'sentiment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'username', 'book_title', 'like_count', 'liked_by_user', 'comment_count', 'sentiment','created_at', 'updated_at']
        
    def get_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def validate_rating(self, value):
        if not (0.5 <= float(value) <= 5.0):
            raise serializers.ValidationError("Rating must be between 0.5 and 5.0")
        #round to nearest 0.5
        return round(float(value) * 2) / 2

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.method == 'POST':
            user = request.user
            book = attrs.get('book')
            if Review.objects.filter(user=user, book=book).exists():
                raise serializers.ValidationError("You have already reviewed this book.")
        return attrs


class ReviewLikeSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = ReviewLike
        fields = ['id', 'user', 'review']
        read_only_fields = ['id', 'user']
        
    
    
class ReviewCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only = True)
    
    class Meta:
        model = ReviewComment
        fields = ['id', 'user', 'username', 'review', 'comment_text', 'created_at']
        read_only_fields = ['id', 'user', 'username', 'created_at']