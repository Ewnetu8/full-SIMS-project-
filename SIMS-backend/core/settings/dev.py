from .base import *

DEBUG = True

# Databases
# Fallback to SQLite if POSTGRES_HOST is not set (e.g. running pytest locally without docker db)
postgres_host = os.environ.get('POSTGRES_HOST')
if postgres_host:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'sims_db'),
            'USER': os.environ.get('POSTGRES_USER', 'sims_user'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'sims_password'),
            'HOST': postgres_host,
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
            # Persistent connections (connection pooling) — §7.5
            'CONN_MAX_AGE': int(os.environ.get('CONN_MAX_AGE', '60')),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Suppress django.request error logging during tests to avoid a Python 3.14
# incompatibility in django.template.context.__copy__ (triggered when the
# test client tries to render the 4xx debug page internally).
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {'class': 'logging.NullHandler'},
    },
    'loggers': {
        'django.request': {
            'handlers': ['null'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
