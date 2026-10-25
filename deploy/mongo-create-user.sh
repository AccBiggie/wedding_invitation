#!/usr/bin/env bash
# Cria o usuario root do MongoDB num banco que ja existe (o MONGO_INITDB_* so vale em volume vazio).
# Rodar UMA vez na VPS, em /opt/wedding, ANTES do deploy que liga o --auth:
#   bash deploy/mongo-create-user.sh
# Usa MONGO_ROOT_USER e MONGO_ROOT_PASSWORD do .env. Se o usuario ja existir, nao faz nada.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
: "${MONGO_ROOT_USER:?defina MONGO_ROOT_USER no .env}" "${MONGO_ROOT_PASSWORD:?defina MONGO_ROOT_PASSWORD no .env}"
docker compose -f docker-compose.prod.yml exec -T \
  -e U="$MONGO_ROOT_USER" -e P="$MONGO_ROOT_PASSWORD" mongodb \
  mongosh --quiet admin --eval '
    const u = process.env.U, p = process.env.P;
    if (db.getUser(u)) print("usuario " + u + " ja existe");
    else { db.createUser({ user: u, pwd: p, roles: [{ role: "root", db: "admin" }] }); print("usuario " + u + " criado"); }'
