from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import create_match, join_match
from .models import Match
from .serializers import MatchSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_match_view(request):
    match = create_match(request.user.id)
    return Response({'match_id': match.id})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_match_view(request, match_id):
    try:
        match = join_match(match_id, request.user.id)
        return Response(MatchSerializer(match).data)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_match_view(request, match_id):
    match = Match.objects.get(id=match_id)
    serializer = MatchSerializer(match)
    return Response(serializer.data)