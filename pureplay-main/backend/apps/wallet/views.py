from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def get_balance(request):
    # Return dummy data without requiring auth (for MVP testing)
    return Response({'balance': 1000, 'currency': 'PP'})

@api_view(['GET'])
def get_transactions(request):
    return Response([])