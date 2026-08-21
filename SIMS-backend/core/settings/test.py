from .dev import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Tests must not be rate-limited: throttle counters persist across the whole
# pytest session (shared client IP + local-memory cache), so the production
# limits (10/min auth, 50/hour anon) trip mid-suite and produce false 429s.
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100000/hour',
    'user': '100000/hour',
    'auth': '100000/hour',
}
