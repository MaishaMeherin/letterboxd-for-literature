from django.shortcuts import render
from rest_framework import viewsets, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
                                                        
# Create your views here.
#ReadOnlyModelViewSet-> created by signals, never by the user directly. gives us list and retrieve but no create, update or delete
class NotificationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    #PATCH /api/v1/notifications/{id}/read/
    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'marked read'})
    
    #POST /api/v1/notifications/read-all/
    @action(detail=False, methods=['post'])
    def read_all(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked read'})
    
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        unread_count = qs.filter(is_read=False).count()
        serializer = self.get_serializer(qs, many=True)
        
        return Response({'unread_count': unread_count, 'results': serializer.data})