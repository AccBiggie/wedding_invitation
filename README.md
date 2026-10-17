# Sistema de Controle de Convites de Casamento

Aplicação React 19 + TypeScript + Material UI 9 para administração do casamento, com páginas públicas preservadas em React/Tabler. A API usa Node.js, Express, MongoDB e Mongoose.

## Executar com Docker

No WSL, instale o Docker Engine e o plugin Docker Compose na distribuição Linux. Inicie o serviço com `sudo service docker start` (ou `sudo systemctl start docker`, se systemd estiver ativo) e configure seu usuário no grupo `docker` para acessar `/var/run/docker.sock`.

Execute `bash start-dev.sh` no WSL. O script usa o socket do Docker Engine local mesmo se o contexto do Docker Desktop estiver selecionado. Acesse `http://localhost:3002`; a API fica em `http://localhost:3001`. Se a porta `3001` estiver ocupada, execute `API_PORT=3003 bash start-dev.sh`; o frontend continua em `3002` e usa `/api` pelo proxy do NGINX. Para parar, use `docker --host unix:///var/run/docker.sock compose down` (mantém os dados do MongoDB). O build Docker executa o typecheck e o build do frontend.

## Executar localmente

Tenha MongoDB disponível, copie `backend/.env.example` para `backend/.env` e `frontend/.env.example` para `frontend/.env`. Em terminais separados: `cd backend; npm install; npm run dev` e `cd frontend; npm install; npm run dev`. Localmente, a API usa a porta `3001`. Para validar: `cd frontend && npm run lint && npm run typecheck && npm run build`; `cd backend && npm test`. Os testes integrados do backend usam `TEST_MONGO_URI=mongodb://localhost:27017/ npm test` e criam/removem um banco temporário com nome aleatório.

## Administração

O painel autenticado usa `/dashboard`, `/convites`, `/padrinhos`, `/presentes` e `/pix`. Padrinhos e Presentes oferecem listagem com filtros, paginação, cadastro, edição e exclusão. A configuração PIX aceita uma chave válida e gera BR Code EMV com QR Code. O modal público Gravata Online aparece na página `/casamento` quando o PIX está ativo. As páginas públicas `/casamento` e `/invitation/:id/:name` continuam disponíveis; a confirmação individual de convidados permanece no convite.

O frontend novo fica em `frontend/src/components`, `pages`, `services`, `types` e `theme`. O código público e o CRUD existente de convites continuam em `frontend/src/main.jsx` enquanto os novos componentes usam TypeScript. As imagens de Padrinhos e Presentes usam URLs públicas; não há upload de arquivos.

## Rotas da API

Admin: `GET/POST /api/invitations`, `GET/PUT/DELETE /api/invitations/:id`. Públicas: `GET /api/public/invitations/:id/:slug?token=...` e `POST /api/public/invitations/:id/confirm`.

Padrinhos: `GET/POST /api/godparents`, `GET/PUT/DELETE /api/godparents/:id`. Presentes: `GET/POST /api/gift-products`, `GET/PUT/DELETE /api/gift-products/:id`. Essas rotas exigem autenticação. Filtros de padrinhos: `name`, `role`, `active`, `page`, `limit`, `sortBy`, `sortOrder`. Filtros de presentes: `name`, `category`, `active`, `minPrice`, `maxPrice`, `page`, `limit`, `sortBy`, `sortOrder`.

PIX: `GET/PUT /api/pix/settings` exige autenticação; `GET /api/pix/status` informa se a configuração está ativa; `POST /api/pix/generate` recebe `{ "amount": 150 }` e retorna valor, BR Code e QR Code. Dados públicos de catálogo: `GET /api/public/godparents` e `GET /api/public/gift-products`.

A listagem aceita `name`, `status`, `startDate`, `endDate`, `page`, `limit`, `sortBy` e `sortOrder`. Respostas seguem `{ success, message, data }`; listagem inclui `pagination`.

Convites públicos são gerados pela interface após o cadastro, com slug e token aleatório não previsível. O token não é retornado pela consulta pública.
