import json
from channels.generic.websocket import AsyncWebsocketConsumer

#consumer works like a view for WebSocket, instead of get()/post(). we have connect()/disconnect()/receive()
class NotificationConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        user = self.scope['user']
        if user.is_anonymous:
            await self.close()
            return
        self.group_name = f'notifications_{user.id}' #each user gets their own named group in Redis, when a signal fires for user_13, it sends to group notifications_13
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept() #no receive(), its server push only. the browser never sends anything over this socket

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event['data']))                    