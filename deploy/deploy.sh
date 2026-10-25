#!/usr/bin/env bash
# Atualiza a VPS para a versao atual da branch production e sobe os containers.
# Chamado pelo CD (GitHub Actions) via SSH, como o usuario deploy:  bash /opt/wedding/deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
test -f .env || { echo "Falta o .env de producao em $(pwd) (modelo: .env.production.example)." >&2; exit 1; }

git fetch --prune origin production
git checkout -q -f production
git reset -q --hard origin/production
echo "Versao: $(git log -1 --format='%h %s')"

docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -f >/dev/null

# Espera o backend ficar saudavel (healthcheck do compose).
for i in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose -f docker-compose.prod.yml ps -q backend)" 2>/dev/null || true)
  [ "$status" = healthy ] && { echo "Backend saudavel."; exit 0; }
  sleep 4
done
echo "Backend nao ficou saudavel a tempo." >&2
docker compose -f docker-compose.prod.yml logs --tail 80 backend >&2
exit 1
