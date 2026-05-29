from rest_framework import generics, permissions
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.contrib.auth import authenticate
from core.security.rate_limit import AuthRateThrottle
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
            'phone': getattr(user, 'phone_number', None),
            'chess_customizations': getattr(user, 'chess_customizations', {}),
        },
    }

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(auth_payload(user), status=201)

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

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

class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(auth_payload(instance))

