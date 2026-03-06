from rest_framework import serializers
from .models import Review

VALID_RATINGS = {x / 2 for x in range(2, 11)}  # 1.0, 1.5, ..., 5.0

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'username', 'book', 'book_title', 'reading_log','rating', 'text', 'contains_spoilers', 'like_count','created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'username', 'book_title', 'like_count','created_at', 'updated_at']

    def validate_rating(self, value):
        if float(value) not in VALID_RATINGS:
            raise serializers.ValidationError("Rating must be between 1.0 and 5.0 in 0.5 increments.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.method == 'POST':
            user = request.user
            book = attrs.get('book')
            if Review.objects.filter(user=user, book=book).exists():
                raise serializers.ValidationError("You have already reviewed this book.")
        return attrs
