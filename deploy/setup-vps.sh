#!/usr/bin/env bash
# Prepara a VPS (Ubuntu/Debian) uma unica vez. Rodar como root:  bash setup-vps.sh <url-ssh-do-repo>
# Instala Docker, liga o firewall (SSH, 80, 443), cria o usuario "deploy" e a chave de deploy do GitHub.
set -euo pipefail
REPO="${1:?uso: bash setup-vps.sh git@github.com:USUARIO/REPO.git}"
APP_DIR=/opt/wedding

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git ufw unattended-upgrades

# Docker Engine + plugin compose, do repositorio oficial.
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  . /etc/os-release
  curl -fsSL "https://download.docker.com/linux/${ID}/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

# Firewall: so SSH e web. (O Docker publica so as portas do Caddy.)
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# SSH so por chave (inclusive root). Os arquivos de sshd_config.d valem na ordem do nome e o
# primeiro valor vence: 00- passa na frente do 50-cloud-init.conf, que liga a senha.
# So aplica se o root ja tiver chave, para nao trancar o acesso.
if [ -s /root/.ssh/authorized_keys ]; then
  printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/00-hardening.conf
  sshd -t && systemctl reload ssh
fi

# Usuario sem senha que o CI usa para o deploy (entra so com chave).
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys && chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys

# Repositorio privado (git@github.com:...): chave de leitura (deploy key do GitHub).
# Repositorio publico (https://...): o clone e direto, sem chave.
if [[ "$REPO" == git@* ]]; then
  [ -f /home/deploy/.ssh/github_deploy ] || sudo -u deploy ssh-keygen -t ed25519 -N "" -C "deploy@$(hostname)" -f /home/deploy/.ssh/github_deploy
  sudo -u deploy sh -c 'printf "Host github.com\n  IdentityFile ~/.ssh/github_deploy\n  IdentitiesOnly yes\n" > ~/.ssh/config && chmod 600 ~/.ssh/config && ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null'
fi
install -d -o deploy -g deploy "$APP_DIR"

echo
if [[ "$REPO" == git@* ]]; then
  echo "== Chave publica de deploy: adicione em GitHub > Settings > Deploy keys (somente leitura):"
  cat /home/deploy/.ssh/github_deploy.pub
  echo
fi
echo "== Depois, como deploy:  git clone -b production $REPO $APP_DIR  e crie $APP_DIR/.env (modelo: .env.production.example)."
