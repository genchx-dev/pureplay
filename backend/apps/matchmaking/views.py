from rest_framework import views, response

class MatchmakingStatusView(views.APIView):
    def get(self, request):
        return response.Response({"status": "Matchmaking system ready for implementation"})
