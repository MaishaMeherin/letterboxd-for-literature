from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    ordering = ['-created_at']
    
    # ... get_queryset, permissions, perform_create as before
    
    @action(detail=False, methods=['get'])
    def grouped_by_user(self, request):
        """
        Return all reviews grouped by user.
        {
            "user_id_1": [review1, review2, ...],
            "user_id_2": [review3, review4, ...]
        }
        """
        qs = self.get_queryset()
        grouped = {}
        for review in qs:
            user_id = str(review.user.id)
            if user_id not in grouped:
                grouped[user_id] = []
            grouped[user_id].append(ReviewSerializer(review).data)
        return Response(grouped)
    
    @action(detail=False, methods=['get'])
    def grouped_by_book(self, request):
        """
        Return all reviews grouped by book.
        {
            "book_id_1": [review1, review2, ...],
            "book_id_2": [review3, review4, ...]
        }
        """
        qs = self.get_queryset()
        grouped = {}
        for review in qs:
            book_id = str(review.book.id)
            if book_id not in grouped:
                grouped[book_id] = []
            grouped[book_id].append(ReviewSerializer(review).data)
        return Response(grouped)