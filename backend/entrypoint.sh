#!/bin/sh
set -e

echo "Aguardando o banco de dados em $DATABASE_HOST:$DATABASE_PORT..."
python - <<'PYEOF'
import os
import socket
import time

host = os.environ.get("DATABASE_HOST", "db")
port = int(os.environ.get("DATABASE_PORT", "5432"))

for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit(f"Banco de dados em {host}:{port} não respondeu a tempo.")
PYEOF

echo "Gerando/aplicando migrações..."
python manage.py makemigrations accounts colaboradores itens movimentacoes --noinput
python manage.py migrate --noinput

echo "Iniciando servidor de desenvolvimento..."
exec python manage.py runserver 0.0.0.0:8000
