from rest_framework import generics, permissions
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSerializer, LoginSerializer


def auth_payload(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {
        'token': token.key,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'tier': getattr(user, 'tier', 'Bronze'),
            'rank': getattr(user, 'rank', 1000),
            'avatar': getattr(user, 'avatar', None),
        },
    }

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(auth_payload(user), status=201)

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if not user:
            found_user = User.objects.filter(email=username).first()
            if found_user:
                user = authenticate(username=found_user.username, password=password)
        if user:
            return Response(auth_payload(user))
        return Response({'error': 'Invalid credentials'}, status=400)
