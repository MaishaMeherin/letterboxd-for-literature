from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import ReadingLog
from .serializers import ReadingLogSerializer
# Create your views here.

class ReadingLogViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReadingLogSerializer
    
    def get_queryset(self):
        return ReadingLog.objects.filter(user=self.request.user).select_related('book')
    
    #autosets the user from jwt token
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    