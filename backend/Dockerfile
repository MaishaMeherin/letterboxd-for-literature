FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uv run python manage.py migrate && uv run daphne -b 0.0.0.0 -p 8000 config.asgi:application"]