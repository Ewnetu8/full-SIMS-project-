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
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
