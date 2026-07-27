import os
from pathlib import Path

# Load .env first, same as base.py will, then force POSTGRES_HOST to
# empty so dev.py's SQLite fallback activates.  Because we load .env
# here with override=False and then overwrite POSTGRES_HOST *after*,
# the later dotenv.load_dotenv() call in base.py (also override=False)
# will skip it since the key already exists.
dotenv_path = Path(__file__).resolve().parent / '.env'
if dotenv_path.exists():
    import dotenv
    dotenv.load_dotenv(str(dotenv_path), override=False)

os.environ['POSTGRES_HOST'] = ''
