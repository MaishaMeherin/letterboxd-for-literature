from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated       
from django.db.models import Max
from .models import Recommendations                          
from logs.models import ReadingLog          
from reviews.models import Review       
from .serializers import RecommendationsSerializer
from .tasks import generate_recommendations_task  


class RecommendationsView(APIView):
    serializer_class = RecommendationsSerializer
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):        
        #1. get logs
        logs = ReadingLog.objects.filter(user=request.user, status='completed').select_related('book')
        
        #if user hasn't finished any books, no point of calling groq so return
        if not logs.exists():
            return Response([], status=200)
        
        existing_recs = Recommendations.objects.filter(user=request.user)
        
        #check staleness
        is_stale = True
        if existing_recs.exists():
            last_generated = existing_recs.aggregate(latest=Max('created_at'))['latest'] #when were recs last created
            latest_log = ReadingLog.objects.filter(user=request.user).aggregate(latest=Max('updated_at'))['latest']  #when did reading log last change
            latest_review = Review.objects.filter(user=request.user).aggregate(latest=Max('updated_at'))['latest']  #when did rating last change  
            candidates = [t for t in [latest_log, latest_review] if t is not None]               
                          
            if candidates and last_generated and max(candidates) <= last_generated:       
                #if nothing has changed since recs were made                    
                is_stale = False  
                
        #if not stale then return whats in the db       
        if not is_stale:
            return Response(RecommendationsSerializer(existing_recs, many=True).data)
        
        #if stale, enqueue celery tasks
        generate_recommendations_task.apply_async(args = [request.user.id], tasks_id = f"recs-{request.user.id}", ) #.delay()-> run this in the background, HTTP request continues immediately after this line
        
        if existing_recs.exists():
            #return stale recs immediately while new one are being generated in the background
            return Response(RecommendationsSerializer(existing_recs, many=True).data)
        
        #first time nothing to show yet
        return Response({"status": "generating"}, status=202)