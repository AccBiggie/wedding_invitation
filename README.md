# Sistema de Controle de Convites de Casamento

Aplicação React + Tabler para criação, administração e confirmação pública de convites, com API Express, MongoDB e Mongoose.

## Executar com Docker

Pré-requisitos: Docker e Docker Compose. Execute `docker compose up --build` e acesse `http://localhost:5173`. A API fica em `http://localhost:3001`.

## Executar localmente

Tenha MongoDB disponível, copie `backend/.env.example` para `backend/.env` e `frontend/.env.example` para `frontend/.env`. Em terminais separados: `cd backend; npm install; npm run dev` e `cd frontend; npm install; npm run dev`. Localmente, a API usa a porta `3001`.

## Rotas da API

Admin: `GET/POST /api/invitations`, `GET/PUT/DELETE /api/invitations/:id`. Públicas: `GET /api/public/invitations/:id/:slug?token=...` e `POST /api/public/invitations/:id/confirm`.

A listagem aceita `name`, `status`, `startDate`, `endDate`, `page`, `limit`, `sortBy` e `sortOrder`. Respostas seguem `{ success, message, data }`; listagem inclui `pagination`.

Convites públicos são gerados pela interface após o cadastro, com slug e token aleatório não previsível. O token não é retornado pela consulta pública.
