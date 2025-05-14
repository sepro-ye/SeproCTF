from CTFd.models import Challenges, Solves, Teams, Users
from CTFd.utils.user import get_current_user
from CTFd.utils.dates import unix_time_to_utc
from CTFd.utils import get_config
from sqlalchemy.sql import func


def count_users():
    """
    Count the number of users registered in the platform
    """
    try:
        return Users.query.filter_by(hidden=False, banned=False).count()
    except Exception:
        return 0


def count_teams():
    """
    Count the number of teams registered in the platform
    """
    try:
        return Teams.query.filter_by(hidden=False, banned=False).count()
    except Exception:
        return 0


def count_challenges():
    """
    Count the number of challenges available in the platform
    """
    try:
        return Challenges.query.filter_by(state="visible").count()
    except Exception:
        return 0


def count_solves():
    """
    Count the total number of successful solves
    """
    try:
        return Solves.query.count()
    except Exception:
        return 0


def user_recent_activity(limit=5):
    """
    Get the recent activity for the user
    """
    user = get_current_user()
    if user:
        solves = Solves.query.filter_by(user_id=user.id).order_by(Solves.date.desc()).limit(limit).all()
        return solves
    return []
