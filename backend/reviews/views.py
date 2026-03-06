from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer
# Create your views here.

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
        elif self.action in ['update', 'partial_update', 'destroy', 'create']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    