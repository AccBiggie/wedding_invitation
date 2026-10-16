#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Usa o Docker Engine instalado no WSL, independentemente do contexto do Docker Desktop.
export DOCKER_HOST=unix:///var/run/docker.sock
unset DOCKER_CONTEXT

if ! docker info >/dev/null 2>&1; then
  echo "Docker Engine do WSL indisponível em /var/run/docker.sock. Inicie o serviço docker e verifique o acesso do usuário ao socket." >&2
  exit 1
fi

echo "Iniciando ambiente de desenvolvimento no Docker Engine do WSL..."
docker compose up --build
