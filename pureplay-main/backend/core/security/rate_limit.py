# pureplay-main/backend/core/security/rate_limit.py

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Rate throttle for anonymous login/registration endpoints."""
    scope = 'auth'


class MatchmakingRateThrottle(UserRateThrottle):
    """Rate throttle for authenticated matchmaking and challenge endpoints."""
    scope = 'matchmaking'


class SearchRateThrottle(UserRateThrottle):
    """Rate throttle for authenticated search endpoints."""
    scope = 'search'
