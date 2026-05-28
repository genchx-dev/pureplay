# apps/adminpanel/views.py

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q, F, Value, CharField
from django.db.models.functions import TruncDate, Coalesce
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.matches.models import Match, Series
from apps.tournaments.models import Tournament, TournamentParticipant, TournamentMatch
from apps.tournaments.services import TournamentService
from apps.wallet.models import Wallet, Transaction
from apps.rankings.models import PlayerStats, MatchHistory
from .permissions import IsStaffUser

User = get_user_model()


# ─────────────────────────────────────────────
#  DASHBOARD OVERVIEW
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_dashboard(request):
    """Return high-level platform statistics."""
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)

    total_users = User.objects.count()
    users_today = User.objects.filter(date_joined__date=today).count()
    users_this_week = User.objects.filter(date_joined__date__gte=week_ago).count()

    active_matches = Match.objects.filter(status='active').count()
    total_matches = Match.objects.filter(status='completed').count()

    active_tournaments = Tournament.objects.filter(status='in_progress').count()
    completed_tournaments = Tournament.objects.filter(status='completed').count()
    registering_tournaments = Tournament.objects.filter(status='registering').count()

    # Financial aggregates
    total_deposited = Transaction.objects.filter(
        transaction_type='deposit', status='completed'
    ).aggregate(total=Coalesce(Sum('amount'), Decimal('0')))['total']

    total_withdrawn = Transaction.objects.filter(
        transaction_type='withdrawal', status='completed'
    ).aggregate(total=Coalesce(Sum('amount'), Decimal('0')))['total']

    total_staked = Transaction.objects.filter(
        transaction_type='stake', status='completed'
    ).aggregate(total=Coalesce(Sum('amount'), Decimal('0')))['total']

    total_won = Transaction.objects.filter(
        transaction_type='win', status='completed'
    ).aggregate(total=Coalesce(Sum('amount'), Decimal('0')))['total']

    # Platform revenue from tournaments (entry fees collected - prize pool distributed)
    total_entry_fees = Tournament.objects.filter(
        status='completed'
    ).aggregate(
        total_fees=Coalesce(Sum(F('entry_fee') * F('current_players')), Decimal('0'))
    )['total_fees']
    total_prize_distributed = Tournament.objects.filter(
        status='completed'
    ).aggregate(total=Coalesce(Sum('prize_pool'), Decimal('0')))['total']
    tournament_revenue = total_entry_fees - total_prize_distributed

    # Quick match revenue (staked amount - winnings paid = platform rake)
    quick_match_revenue = total_staked - total_won
    if quick_match_revenue < 0:
        quick_match_revenue = Decimal('0')

    total_platform_revenue = tournament_revenue + quick_match_revenue

    # Platform balance (sum of all user wallets)
    platform_wallet_total = Wallet.objects.aggregate(
        total=Coalesce(Sum('balance'), Decimal('0')),
        locked=Coalesce(Sum('locked_balance'), Decimal('0'))
    )

    return Response({
        'users': {
            'total': total_users,
            'today': users_today,
            'this_week': users_this_week,
        },
        'matches': {
            'active': active_matches,
            'total_completed': total_matches,
        },
        'tournaments': {
            'registering': registering_tournaments,
            'active': active_tournaments,
            'completed': completed_tournaments,
        },
        'financial': {
            'total_deposited': float(total_deposited),
            'total_withdrawn': float(total_withdrawn),
            'total_staked': float(total_staked),
            'total_won': float(total_won),
            'total_prize_distributed': float(total_prize_distributed),
            'platform_wallet_total': float(platform_wallet_total['total']),
            'platform_locked_total': float(platform_wallet_total['locked']),
        },
        'revenue': {
            'tournament_revenue': float(tournament_revenue),
            'quick_match_revenue': float(quick_match_revenue),
            'total_platform_revenue': float(total_platform_revenue),
        },
    })


# ─────────────────────────────────────────────
#  ANALYTICS TIMESERIES
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_analytics(request):
    """Return daily timeseries data for charts (last 30 days)."""
    days = int(request.query_params.get('days', 30))
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days - 1)

    # Daily signups
    signups = (
        User.objects.filter(date_joined__date__gte=start_date)
        .annotate(day=TruncDate('date_joined'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )

    # Daily matches
    matches = (
        Match.objects.filter(status='completed', created_at__date__gte=start_date)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )

    # Daily deposits
    deposits = (
        Transaction.objects.filter(
            transaction_type='deposit', status='completed',
            created_at__date__gte=start_date
        )
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(total=Coalesce(Sum('amount'), Decimal('0')))
        .order_by('day')
    )

    # Daily withdrawals
    withdrawals = (
        Transaction.objects.filter(
            transaction_type='withdrawal', status='completed',
            created_at__date__gte=start_date
        )
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(total=Coalesce(Sum('amount'), Decimal('0')))
        .order_by('day')
    )

    # Daily stakes
    stakes = (
        Transaction.objects.filter(
            transaction_type='stake', status='completed',
            created_at__date__gte=start_date
        )
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(total=Coalesce(Sum('amount'), Decimal('0')))
        .order_by('day')
    )

    def series_to_dict(qs, value_key='count'):
        return {str(item['day']): float(item[value_key]) for item in qs}

    # Calculate daily platform revenue (30 days timeseries)
    daily_revenue = {}
    for i in range(days):
        day = start_date + timedelta(days=i)
        daily_revenue[str(day)] = Decimal('0')

    completed_quick_matches = Match.objects.filter(
        status='completed',
        winner__isnull=False,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    )
    for m in completed_quick_matches:
        if not (m.game_state or {}).get('isTournament', False):
            day_str = str(m.created_at.date())
            if day_str in daily_revenue:
                stake = Decimal(str(m.game_state.get('stake', 0)))
                daily_revenue[day_str] += stake * Decimal('0.10')

    completed_tourneys = Tournament.objects.filter(
        status='completed',
        completed_at__date__gte=start_date,
        completed_at__date__lte=end_date
    )
    for t in completed_tourneys:
        day_str = str(t.completed_at.date())
        if day_str in daily_revenue:
            entry_fees = t.entry_fee * t.current_players
            cut = entry_fees - t.prize_pool
            daily_revenue[day_str] += cut

    return Response({
        'period': {'start': str(start_date), 'end': str(end_date)},
        'daily_signups': series_to_dict(signups),
        'daily_matches': series_to_dict(matches),
        'daily_deposits': series_to_dict(deposits, 'total'),
        'daily_withdrawals': series_to_dict(withdrawals, 'total'),
        'daily_stakes': series_to_dict(stakes, 'total'),
        'daily_revenue': {k: float(v) for k, v in daily_revenue.items()},
    })


# ─────────────────────────────────────────────
#  USER MANAGEMENT
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_users(request):
    """Paginated list of all users with wallet and match stats."""
    search = request.query_params.get('search', '').strip()
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 25))

    qs = User.objects.all().order_by('-date_joined')
    if search:
        qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search))

    total = qs.count()
    offset = (page - 1) * page_size
    users = qs[offset:offset + page_size]

    results = []
    for u in users:
        wallet_balance = Decimal('0')
        try:
            wallet_balance = u.wallet.balance
        except Wallet.DoesNotExist:
            pass

        stats = None
        try:
            ps = PlayerStats.objects.get(user=u)
            stats = {
                'wins': ps.wins,
                'losses': ps.losses,
                'draws': ps.draws,
                'total_matches': ps.total_matches,
                'win_rate': round(ps.wins / ps.total_matches * 100, 1) if ps.total_matches > 0 else 0,
                'mmr': ps.mmr,
                'xp': ps.xp,
            }
        except PlayerStats.DoesNotExist:
            total_matches = Match.objects.filter(
                Q(player1=u) | Q(player2=u), status='completed'
            ).count()
            wins = Match.objects.filter(winner=u, status='completed').count()
            stats = {
                'wins': wins,
                'losses': total_matches - wins,
                'draws': 0,
                'total_matches': total_matches,
                'win_rate': round(wins / total_matches * 100, 1) if total_matches > 0 else 0,
                'mmr': 1000,
                'xp': 0,
            }

        results.append({
            'id': str(u.id),
            'username': u.username,
            'email': u.email,
            'date_joined': u.date_joined.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None,
            'is_staff': u.is_staff,
            'is_active': u.is_active,
            'wallet_balance': float(wallet_balance),
            'stats': stats,
        })

    return Response({
        'total': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })


# ─────────────────────────────────────────────
#  TOURNAMENT MANAGEMENT
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_tournaments(request):
    """List all tournaments with full details."""
    status_filter = request.query_params.get('status', '')
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 25))

    qs = Tournament.objects.all().order_by('-created_at')
    if status_filter:
        qs = qs.filter(status=status_filter)

    total = qs.count()
    offset = (page - 1) * page_size
    tournaments = qs[offset:offset + page_size]

    results = []
    for t in tournaments:
        winner = None
        participants = TournamentParticipant.objects.filter(tournament=t)
        champion = participants.filter(current_rank=1).first()
        if champion:
            winner = champion.user.username

        results.append({
            'id': str(t.id),
            'name': t.name,
            'game_type': t.game_type,
            'bracket_type': t.bracket_type,
            'tournament_type': t.tournament_type,
            'status': t.status,
            'entry_fee': float(t.entry_fee),
            'prize_pool': float(t.prize_pool),
            'max_players': t.max_players,
            'current_players': t.current_players,
            'winner': winner,
            'created_at': t.created_at.isoformat(),
            'started_at': t.started_at.isoformat() if t.started_at else None,
            'completed_at': t.completed_at.isoformat() if t.completed_at else None,
            'scheduled_start_time': t.scheduled_start_time.isoformat() if hasattr(t, 'scheduled_start_time') and t.scheduled_start_time else None,
            'registration_deadline': t.registration_deadline.isoformat() if hasattr(t, 'registration_deadline') and t.registration_deadline else None,
        })

    return Response({
        'total': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_create_tournament(request):
    """Create a new tournament from admin panel."""
    data = request.data
    name = data.get('name', 'New Tournament')
    game_type = data.get('game_type', 'tictactoe')
    entry_fee = data.get('entry_fee', 0)
    max_players = data.get('max_players', 8)
    bracket_type = data.get('bracket_type', 'single_elimination')
    tournament_type = data.get('tournament_type', 'knockout')
    prize_distribution = data.get('prize_distribution', {})
    scheduled_start_time = data.get('scheduled_start_time', None)
    registration_deadline = data.get('registration_deadline', None)

    try:
        tournament = TournamentService.create_tournament(
            created_by=request.user,
            name=name,
            game_type=game_type,
            entry_fee=entry_fee,
            max_players=max_players,
            bracket_type=bracket_type,
            tournament_type=tournament_type,
            prize_distribution=prize_distribution,
        )

        # Set scheduling fields if provided
        if scheduled_start_time:
            from django.utils.dateparse import parse_datetime
            tournament.scheduled_start_time = parse_datetime(scheduled_start_time)
        if registration_deadline:
            from django.utils.dateparse import parse_datetime
            tournament.registration_deadline = parse_datetime(registration_deadline)

        if scheduled_start_time or registration_deadline:
            tournament.save(update_fields=[
                f for f in ['scheduled_start_time', 'registration_deadline']
                if hasattr(tournament, f) and getattr(tournament, f) is not None
            ])

        return Response({
            'id': str(tournament.id),
            'name': tournament.name,
            'status': tournament.status,
            'message': 'Tournament created successfully.',
        }, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_start_tournament(request, tournament_id):
    """Manually start a tournament (generates bracket)."""
    try:
        TournamentService.start_tournament(tournament_id)
        return Response({'message': 'Tournament started successfully.'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_cancel_tournament(request, tournament_id):
    """Cancel a tournament and refund all entry fees."""
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        if tournament.status == 'completed':
            return Response({'error': 'Cannot cancel a completed tournament.'}, status=400)

        # Refund entry fees to all participants
        participants = TournamentParticipant.objects.filter(tournament=tournament)
        if tournament.entry_fee > 0:
            from apps.wallet.services import WalletService
            for p in participants:
                try:
                    WalletService.deposit(
                        p.user,
                        tournament.entry_fee,
                        description=f"Refund for cancelled tournament: {tournament.name}"
                    )
                except Exception:
                    pass

        tournament.status = 'cancelled'
        tournament.save(update_fields=['status'])

        return Response({
            'message': f'Tournament cancelled. {participants.count()} participants refunded.',
        })
    except Tournament.DoesNotExist:
        return Response({'error': 'Tournament not found.'}, status=404)


# ─────────────────────────────────────────────
#  FINANCIAL AUDIT LOG
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_transactions(request):
    """Paginated, filterable list of all transactions."""
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 50))
    tx_type = request.query_params.get('type', '')
    tx_status = request.query_params.get('status', '')
    search = request.query_params.get('search', '').strip()
    date_from = request.query_params.get('date_from', '')
    date_to = request.query_params.get('date_to', '')

    qs = Transaction.objects.select_related('wallet__user').all().order_by('-created_at')

    if tx_type:
        qs = qs.filter(transaction_type=tx_type)
    if tx_status:
        qs = qs.filter(status=tx_status)
    if search:
        qs = qs.filter(wallet__user__username__icontains=search)
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)

    total = qs.count()
    offset = (page - 1) * page_size
    txs = qs[offset:offset + page_size]

    results = []
    for tx in txs:
        results.append({
            'id': str(tx.id),
            'username': tx.wallet.user.username,
            'type': tx.transaction_type,
            'amount': float(tx.amount),
            'status': tx.status,
            'reference_id': tx.reference_id,
            'description': tx.description,
            'created_at': tx.created_at.isoformat(),
        })

    return Response({
        'total': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })


# ─────────────────────────────────────────────
#  MATCH HISTORY
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_matches(request):
    """Paginated list of all matches."""
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 50))
    match_status = request.query_params.get('status', '')
    game_type = request.query_params.get('game_type', '')
    is_tournament = request.query_params.get('is_tournament', '')
    search = request.query_params.get('search', '').strip()

    qs = Match.objects.select_related('player1', 'player2', 'winner').all().order_by('-created_at')

    if match_status:
        qs = qs.filter(status=match_status)

    if game_type:
        if game_type == 'tictactoe':
            qs = qs.filter(Q(game_state__gameType='tictactoe') | 
                          Q(game_state__gameType__isnull=True) | 
                          ~Q(game_state__has_key='gameType'))
        else:
            qs = qs.filter(game_state__gameType=game_type)

    if is_tournament:
        if is_tournament == 'true':
            qs = qs.filter(game_state__isTournament=True)
        elif is_tournament == 'false':
            qs = qs.filter(Q(game_state__isTournament=False) | 
                          Q(game_state__isTournament__isnull=True) | 
                          ~Q(game_state__has_key='isTournament'))

    if search:
        qs = qs.filter(Q(player1__username__icontains=search) | Q(player2__username__icontains=search))

    total = qs.count()
    offset = (page - 1) * page_size
    matches = qs[offset:offset + page_size]

    results = []
    for m in matches:
        game_state = m.game_state or {}
        stake_val = game_state.get('stake', 0)
        results.append({
            'id': str(m.id),
            'player1': m.player1.username if m.player1 else None,
            'player2': m.player2.username if m.player2 else None,
            'winner': m.winner.username if m.winner else None,
            'status': m.status,
            'game_type': game_state.get('gameType', 'tictactoe'),
            'stake': float(stake_val) if stake_val is not None else 0.0,
            'is_tournament': game_state.get('isTournament', False),
            'created_at': m.created_at.isoformat(),
        })

    return Response({
        'total': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def admin_games(request):
    """Return stats for games: Tic Tac Toe, Chess, Whot."""
    from apps.matchmaking.queue import _queues

    games_list = [
        {'id': 'tictactoe', 'name': 'Tic Tac Toe'},
        {'id': 'chess', 'name': 'Chess'},
        {'id': 'whot', 'name': 'Whot! Cards'},
    ]

    results = []
    for g in games_list:
        game_id = g['id']
        name = g['name']

        if game_id == 'tictactoe':
            q_filter = (Q(game_state__gameType='tictactoe') | 
                        Q(game_state__gameType__isnull=True) | 
                        ~Q(game_state__has_key='gameType'))
        else:
            q_filter = Q(game_state__gameType=game_id)

        active_matches = Match.objects.filter(status='active').filter(q_filter).count()

        # quick_matches_played: completed quick matches
        quick_matches_played = Match.objects.filter(status='completed').filter(q_filter)
        quick_matches_played_count = 0
        for m in quick_matches_played:
            if not (m.game_state or {}).get('isTournament', False):
                quick_matches_played_count += 1

        # Calculate revenue made from quick match rake (only where winner__isnull=False)
        # and tournament cuts from completed tournaments
        quick_matches_won = Match.objects.filter(status='completed', winner__isnull=False).filter(q_filter)
        quick_rake = Decimal('0')
        for m in quick_matches_won:
            if not (m.game_state or {}).get('isTournament', False):
                stake = Decimal(str(m.game_state.get('stake', 0)))
                quick_rake += stake * Decimal('0.10')

        tourneys = Tournament.objects.filter(status='completed', game_type=game_id)
        tourney_cut = Decimal('0')
        for t in tourneys:
            tourney_cut += (t.entry_fee * t.current_players) - t.prize_pool

        revenue_made = quick_rake + tourney_cut

        # Queue entries
        queue_entries = sum(1 for entry in _queues.values() if entry.get('game_type') == game_id)

        # online_users = (active_matches * 2) + queue_entries
        online_users = (active_matches * 2) + queue_entries

        results.append({
            'id': game_id,
            'label': name,
            'active_matches': active_matches,
            'quick_matches_played': quick_matches_played_count,
            'revenue_made': float(revenue_made),
            'online_users': online_users,
            'queue_users': queue_entries,
        })

    return Response(results)
