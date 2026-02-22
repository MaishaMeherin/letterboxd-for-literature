letterboxd_literature/
├── .git/
├── backend/
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── users/
│   │   ├── models.py
│   │   ├── serializers.py      ← you'll create this
│   │   ├── views.py
│   │   ├── urls.py             ← you'll create this
│   │   └── ...
│   ├── books/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── ...
│   ├── reviews/
│   │   └── ...
│   ├── logs/
│   │   └── ...
│   ├── shelves/
│   │   └── ...
│   ├── manage.py
│   ├── pyproject.toml          ← uv creates this
│   └── uv.lock                 ← uv creates this
├── frontend/                   ← you'll add this later with Vite
└── .gitignore


# Backend
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env
uv --version

cd backend
uv init
uv add django djangorestframework djangorestframework-simplejwt django-cors-headers pillow
uv run django-admin startproject config .
uv run python manage.py startapp users
uv run python manage.py startapp books
uv run python manage.py startapp reviews
uv run python manage.py startapp logs
uv run python manage.py startapp shelves




# Frontend
cd ~/Desktop/letterboxd_literature
npm install -g yarn
yarn create vite frontend --template react
cd frontend
yarn add antd @ant-design/icons zustand @tanstack/react-query axios react-router-dom
yarn dev
cd ..
```

Create your apps upfront even though you won't fill them all immediately. This way your project structure matches the SRS from the start. Use SQLite for now — switching to Postgres later when you add Docker is a one-line settings change.

**Day 2–3 — User model and JWT auth.**

This is your first real feature. Extend Django's `AbstractUser` in your users app with the fields from SRS Section 5.2 (display_name, bio, avatar, is_private). Set `AUTH_USER_MODEL = 'users.CustomUser'` in settings before your first migration — changing this later is painful.

Wire up SimpleJWT with register, login, refresh, and logout endpoints. If you've never used DRF serializers before, this is where you learn them. Build a `RegisterSerializer` that validates email uniqueness, hashes the password, and creates the user. Use SimpleJWT's built-in views for token obtain and refresh.

Test everything in Postman before touching React. Your endpoints should be:
```
POST /api/v1/auth/register/    → creates user, returns 201
POST /api/v1/auth/login/       → returns access + refresh tokens
POST /api/v1/auth/refresh/     → returns new access token

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

The router auto-generates all the URL patterns for you:
```
GET    /api/v1/books/          → list all books
POST   /api/v1/books/          → create a book
GET    /api/v1/books/{id}/     → get one book
PATCH  /api/v1/books/{id}/     → update a book
DELETE /api/v1/books/{id}/     → delete a book