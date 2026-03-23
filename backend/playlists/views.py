from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import BookPlaylist
from books.models import Book
from .serializers import BookPlaylistSerializer
from .groq import get_playlist

class PlaylistView(APIView):
    serializer_class = BookPlaylistSerializer
    permission_classes = [IsAuthenticated]
    
    def get(self, request, book_id):
    #get book id from url
    #look up book in database
        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "Book not found"}, status=404)

 
    #if a playlist for that book already exists return
        playlist = BookPlaylist.objects.filter(book=book)
        if playlist.exists():
            serializer = BookPlaylistSerializer(playlist, many=True)
            return Response (serializer.data) 
        
    #else call get_playlist()
        playlist = get_playlist(book.title, book.authors, book.genres, book.description)
        print('playlist rec from groq: ', playlist)
        
        if not playlist:
            return Response([], status=200)
    #save results to db
        BookPlaylist.objects.bulk_create([
            BookPlaylist(book=book, **item) 
                for item in playlist
        ])
        saved_playlist = BookPlaylist.objects.filter(book=book)
        serializer = BookPlaylistSerializer(saved_playlist, many=True)
        return Response (serializer.data)
    