# Sistema de Controle de Convites de Casamento

Aplicação React + Tabler para criação, administração e confirmação pública de convites, com API Express, MongoDB e Mongoose.

## Executar com Docker

No WSL, instale o Docker Engine e o plugin Docker Compose na distribuição Linux. Inicie o serviço com `sudo service docker start` (ou `sudo systemctl start docker`, se systemd estiver ativo) e configure seu usuário no grupo `docker` para acessar `/var/run/docker.sock`.

Execute `bash start-dev.sh` no WSL. O script usa o socket do Docker Engine local mesmo se o contexto do Docker Desktop estiver selecionado. Acesse `http://localhost:3002`; a API fica em `http://localhost:3001`. Se a porta `3001` estiver ocupada, execute `API_PORT=3003 bash start-dev.sh`; o frontend continua em `3002` e usa `/api` pelo proxy do NGINX. Para parar, use `docker --host unix:///var/run/docker.sock compose down` (mantém os dados do MongoDB).

## Executar localmente

Tenha MongoDB disponível, copie `backend/.env.example` para `backend/.env` e `frontend/.env.example` para `frontend/.env`. Em terminais separados: `cd backend; npm install; npm run dev` e `cd frontend; npm install; npm run dev`. Localmente, a API usa a porta `3001`.

## Rotas da API

Admin: `GET/POST /api/invitations`, `GET/PUT/DELETE /api/invitations/:id`. Públicas: `GET /api/public/invitations/:id/:slug?token=...` e `POST /api/public/invitations/:id/confirm`.

A listagem aceita `name`, `status`, `startDate`, `endDate`, `page`, `limit`, `sortBy` e `sortOrder`. Respostas seguem `{ success, message, data }`; listagem inclui `pagination`.

Convites públicos são gerados pela interface após o cadastro, com slug e token aleatório não previsível. O token não é retornado pela consulta pública.
