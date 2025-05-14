from flask import current_app
from CTFd.utils import get_config
from .helpers import count_users, count_teams, count_challenges, count_solves, user_recent_activity

# CTFd loads themes via this load function
def load(app):
    """
    Load the sepro theme
    This function is automatically called by CTFd upon app initialization
    """
    # Register helper functions with Jinja environment
    app.jinja_env.globals.update(count_users=count_users)
    app.jinja_env.globals.update(count_teams=count_teams)
    app.jinja_env.globals.update(count_challenges=count_challenges)
    app.jinja_env.globals.update(count_solves=count_solves)
    app.jinja_env.globals.update(user_recent_activity=user_recent_activity)
    
    # Initialize theme configuration
    app.config.setdefault("THEME_SEPRO", {})
