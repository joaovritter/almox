FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.dev

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

# Invocado via "sh" explicitamente (em vez de confiar no bit de execução do
# arquivo) porque o docker-compose faz bind mount de ./backend por cima de
# /app, e no Docker Desktop (Windows) o bit +x de um arquivo montado do host
# nem sempre é preservado.
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
