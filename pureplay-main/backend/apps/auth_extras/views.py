from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    user = request.user
    return Response({
        'id': str(user.id),
        'username': user.username,
        'email': user.email,
        'tier': getattr(user, 'tier', 'Bronze'),
        'rank': getattr(user, 'rank', 1000),
        'avatar': getattr(user, 'avatar', None),
        'phone': getattr(user, 'phone_number', None),
        'chess_customizations': getattr(user, 'chess_customizations', {}),
    })
