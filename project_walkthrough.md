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

## Backend (Django with uv) run:
cd backend
uv run python manage.py runserver

# run migrations
cd backend
uv run python manage.py makemigrations
uv run python manage.py migrate

# Frontend
cd ~/Desktop/letterboxd_literature
npm install -g yarn
yarn create vite frontend --template react
cd frontend
yarn add antd @ant-design/icons zustand @tanstack/react-query axios react-router-dom
yarn dev
cd ..

# Seeding Books
cd ~/Desktop/letterboxd_literature/backend
mkdir -p books/management/commands
touch books/management/__init__.py
touch books/management/commands/__init__.py

uv add requests

## Frontend run:
cd frontend
yarn dev


## applying sentiment analysis 
uv run python manage.py shell
from reviews.models import Review
from reviews.sentiment import analyze_sentiment
for review in Review.objects.all():
    review.sentiment = analyze_sentiment(review.text)
    review.save(update_fields=['sentiment'])

print("Done:", Review.objects.exclude(sentiment=None).count(), "reviews updated")