# Nika Honey — Render deployment notes

Root Directory: `backend`

Build Command:
```text
pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
```

Start Command:
```text
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

Required production environment variables are documented in the root `.env.example`.
Production settings require `DATABASE_URL` to resolve to PostgreSQL; they never silently fall back to SQLite.
