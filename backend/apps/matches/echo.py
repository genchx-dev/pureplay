from channels.generic.websocket import AsyncWebsocketConsumer

class EchoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
    async def receive(self, text_data):
        await self.send(text_data=f"Echo: {text_data}")