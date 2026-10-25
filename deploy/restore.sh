#!/usr/bin/env bash
# Restaura um backup do banco de producao. ATENCAO: substitui os dados atuais.
# Uso (na VPS, em /opt/wedding):  bash deploy/restore.sh backups/wedding-AAAA-MM-DD.archive.gz
set -euo pipefail
cd "$(dirname "$0")/.."
FILE="${1:?uso: bash deploy/restore.sh backups/wedding-AAAA-MM-DD.archive.gz}"
test -f "$FILE" || { echo "Arquivo nao encontrado: $FILE" >&2; exit 1; }
read -r -p "Substituir o banco atual por $FILE? Digite SIM: " ok
[ "$ok" = SIM ] || { echo "Cancelado."; exit 1; }
docker compose -f docker-compose.prod.yml exec -T mongodb mongorestore --drop --gzip --archive < "$FILE"
echo "Restaurado."
