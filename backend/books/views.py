from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Book
from .serializers import BookSerializer, BookShelfTagSerializer
# Create your views here.


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'authors']
    ordering_fields = ['rating_count', 'avg_rating']
    ordering = ['-rating_count']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'trending', 'popular', 'top_rated', 'recent', 'preview', 'shelf_tags']: 
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'], url_path='trending')
    def trending(self, request):
        """Books with the most activity in the last 7 days"""
        week_ago = timezone.now() - timedelta(days=7)
        
        #for each book count its recent logs + recent reviews = activity
        #annotate creates temporary field, Q filter what gets counted
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
    
    @action(detail=True, methods=['get'], url_path='preview')
    def preview(self, request, pk=None):
        'check if google books preview available for this book, by checking if its google_books_id exist'
        
        book = self.get_object()
        
        if not book.google_books_id:
            return Response({"error": "No Google Books ID"}, status=404)
        
        return Response({
            "google_books_id": book.google_books_id,
        })
        
    @action(detail=True, methods=['get'], url_path='shelf-tags')
    def shelf_tags(self, request, pk=None):
        book = self.get_object()
        tags = book.shelf_tags.order_by('-mention_count')[:30]
        serializer = BookShelfTagSerializer(tags, many=True)
        return Response(serializer.data)