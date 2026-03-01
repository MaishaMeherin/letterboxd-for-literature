# Plan: Migrate from SQLite to PostgreSQL

## Context
The project currently uses SQLite (hardcoded in `config/settings.py`). The SRS requires PostgreSQL. This plan migrates the database driver and config — no data migration is needed since this is a dev environment with test data.

---

## Steps

### 1. Install PostgreSQL driver
In `backend/`, run:
```sh
uv add psycopg2-binary
```

### 2. Create `backend/.env`
```ini
SECRET_KEY=django-insecure-your-key-here
DEBUG=True
DB_NAME=pageturner
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```
Also add `backend/.env` to `.gitignore`.

### 3. Install `python-dotenv` (or `django-environ`)
```sh
uv add django-environ
```
This lets settings.py read `.env` cleanly.

### 4. Update `backend/config/settings.py`

**Add at the top:**
```python
import environ
env = environ.Env(DEBUG=(bool, True))
environ.Env.read_env(BASE_DIR / '.env')
```

**Replace `SECRET_KEY` and `DEBUG`:**
```python
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
```

**Replace `DATABASES`:**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='pageturner'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='postgres'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}
```

### 5. Create the PostgreSQL database locally
```sh
createdb pageturner        # using psql CLI
# or: psql -U postgres -c "CREATE DATABASE pageturner;"
```

### 6. Run migrations on the new database
```sh
cd backend
uv run python manage.py migrate
uv run python manage.py createsuperuser   # optional
```

---

## Files Modified
| File | Change |
|---|---|
| `backend/pyproject.toml` | Add `psycopg2-binary`, `django-environ` |
| `backend/.env` | **Create** — DB credentials (gitignored) |
| `backend/config/settings.py` | Switch DATABASES to PostgreSQL, load env vars |
| `.gitignore` (root or backend) | Add `backend/.env`, `*.sqlite3` |

---

## Verification
1. `uv run python manage.py migrate` — should apply all existing migrations to PostgreSQL with no errors
2. `uv run python manage.py runserver` — server starts without DB errors
3. Hit `http://127.0.0.1:8000/api/v1/books/` — returns data (or empty list) from PostgreSQL
4. Check with `psql -U postgres -d pageturner -c "\dt"` — all Django tables visible

---

## Notes
- No data migration needed — SQLite `db.sqlite3` is just dev data; you'll start fresh on Postgres
- Docker Compose for Postgres can be added later (SRS infra phase); for now a local Postgres install is sufficient
- `psycopg2-binary` is fine for dev; swap to `psycopg2` (compiled) for production
