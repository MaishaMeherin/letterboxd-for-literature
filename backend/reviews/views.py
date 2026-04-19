from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Review, ReviewLike, ReviewComment
from .serializers import ReviewSerializer, ReviewLikeSerializer, ReviewCommentSerializer
from .sentiment_groq import analyze_sentiment
from .tasks import analyze_sentiment_task
from django.db.models import Avg, Count


# Owner or read-only permissions
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        #SAFE_METHODS, which is a tuple containing 'GET', 'OPTIONS' and 'HEAD'
        if request.method in permissions.SAFE_METHODS:
            #allow read
            return True
        #allow write
        return obj.user == request.user
    
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    ordering = ['-created_at']
    
    # GET /api/v1/reviews/?book=<book_id>   → all reviews for that book
    # GET /api/v1/reviews/?user=<user_id>   → all reviews by that user
    def get_queryset(self):
        qs = Review.objects.select_related('user', 'book').all()
        book_id = self.request.query_params.get('book')
        user_id = self.request.query_params.get('user')
        
        if book_id:
            qs = qs.filter(book=book_id)
        if user_id:
            qs = qs.filter(user=user_id)
        return qs
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        elif self.action in ['create']:
            return [permissions.IsAuthenticated()]
        #update, partial_update, destroy- only owner
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
    
    #validates request data through serializer
    def perform_create(self, serializer):
        review = serializer.save(user=self.request.user, sentiment='pending')
        analyze_sentiment_task.delay(str(review.id))
        
    def perform_update(self, serializer):
        old_text = serializer.instance.text
        review = serializer.save(sentiment='pending')
        # Only re-run sentiment if text actually changed
        if review.text != old_text:
            analyze_sentiment_task.delay(str(review.id))
        # Book stats handled by signal — no manual update needed
        
    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own reviews.")
        instance.delete()
    
#     POST   /api/v1/reviews/{id}/like/   → like
#     DELETE /api/v1/reviews/{id}/like/   → unlike  
    @action(detail=True, methods=['post','delete'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        review = self.get_object()
        like, created = ReviewLike.objects.get_or_create(user=request.user, review=review)
        
        if not created:
            like.delete()
            
        review.like_count = review.likes.count()
        review.save(update_fields=['like_count'])
        return Response({'like_count': review.like_count, "liked": created})
    

# GET /api/v1/reviews/{id}/comment -> get all comments for that review
# POST /api/v1/reviews/{id}/comment -> post comments for that review
    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, pk=None):
        review = self.get_object()
        if request.method == 'GET':
            comments = review.comments.select_related('user').all()
            
            #many=True-> serialize this as list not object
            serializer = ReviewCommentSerializer(comments, many=True)
            return Response(serializer.data) 
        
        #uses the payload from frontend
        serializer = ReviewCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, review=review)
            review.comment_count = review.comments.count()
            review.save(update_fields=['comment_count'])
            return Response(serializer.data, status=201)
        
        return Response(serializer.errors, status=400)
        
  
# for individual comment operation
# /api/v1/comments/{comment_id}/ -> PATCH PUT DELETE  
class ReviewCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewCommentSerializer

    def get_queryset(self):
        queryset = ReviewComment.objects.select_related('user')
        return queryset
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]