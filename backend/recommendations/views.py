from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Recommendations
from logs.models import ReadingLog
from .serializers import RecommendationsSerializer
from .groq import get_recommendations


class RecommendationsView(APIView):
    serializer_class = RecommendationsSerializer
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):        
        #1. get logs
        logs = ReadingLog.objects.filter(user=request.user, status='completed').select_related('book')

        
        if not logs.exists():
            return Response([], status=200)
        
        books_read = [] #list of strings
        for log in logs:
            book = log.book
            genres = ", ".join(book.genres) if book.genres else "unknown"
            books_read.append(f'- "{book.title}" by {", ".join(book.authors)} (genres: {genres})')
            
        Recommendations.objects.filter(user=request.user).delete()
        
        book_list = "\n".join(books_read) # a single string
    
        recommendations= get_recommendations(book_list)
        
        print('recommendations from groq: ', recommendations)
        
        # insert all the recs in Recommendations table
        Recommendations.objects.bulk_create([
            Recommendations(user=request.user, **item)
                for item in recommendations
            ]) 
            
        saved = Recommendations.objects.filter(user=request.user)
        
        serializer = RecommendationsSerializer(saved, many=True)
        
        return Response(serializer.data)
        
        #2. build prompts
        #3. call groq 
        #4. delete old
        #5. bulk create
        #6. serialize and return
        
        