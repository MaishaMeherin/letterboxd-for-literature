from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Book
from .serializers import BookSerializer
# Create your views here.


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'trending', 'popular', 'top_rated', 'recent']: 
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'], url_path='trending')
    def trending(self, request):
        """Books with the most activity in the last 7 days"""
        week_ago = timezone.now() - timedelta(days=7)
        
        #for each book count its recent logs + recent reviews = activity
        books = Book.objects.annotate(
            activity=Count(
                'reading_logs',
                filter=Q(reading_logs__created_at__gte=week_ago)
            ) + Count(
                'reviews',
                filter=Q(reviews__created_at__gte=week_ago)
            )
        )
        
        #only keep books with activity > 0
        books = books.filter(activity__gt=0)
        
        #most active first
        books = books.order_by('-activity')[:20]
        
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='top-rated')
    def top_rated(self, request):
        """Books with highest rating in descending order"""
        
        #books with more than 3 ratings 
        books = Book.objects.filter(
            rating_count__gte=3
        )
        
        books = books.order_by('-avg_rating', '-rating_count')[:20]
        
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='popular')
    def popular(self, request):
        """Most reviewed books of all time"""
        
        books = Book.objects.filter(
            rating_count__gt=0
        )
        
        books = books.order_by('-rating_count', '-avg_rating')[:20]
        
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)
    
    
    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        """Most recently added books"""
        
        #exclude is opposite of filter
        books = (Book.objects
                .exclude(cover_url__isnull=True)
                .exclude(cover_url='')
                .exclude(authors=[])
                .order_by('-created_at')[:20])
        
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)