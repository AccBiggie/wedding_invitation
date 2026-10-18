# Sistema de Controle de Convites de Casamento

Aplicação React 19 + TypeScript + Material UI 9 para administração do casamento, com páginas públicas preservadas em React/Tabler. A API usa Node.js, Express, MongoDB e Mongoose.

## Executar com Docker

No WSL, instale o Docker Engine e o plugin Docker Compose na distribuição Linux. Inicie o serviço com `sudo service docker start` (ou `sudo systemctl start docker`, se systemd estiver ativo) e configure seu usuário no grupo `docker` para acessar `/var/run/docker.sock`.

Execute `bash start-dev.sh` no WSL. O script usa o socket do Docker Engine local mesmo se o contexto do Docker Desktop estiver selecionado. Acesse `http://localhost:3002`; a API fica em `http://localhost:3001`. Se a porta `3001` estiver ocupada, execute `API_PORT=3003 bash start-dev.sh`; o frontend continua em `3002` e usa `/api` pelo proxy do NGINX. Para parar, use `docker --host unix:///var/run/docker.sock compose down` (mantém os dados do MongoDB). O build Docker executa o typecheck e o build do frontend.

## Executar localmente

Tenha MongoDB disponível, copie `backend/.env.example` para `backend/.env` e `frontend/.env.example` para `frontend/.env`. Em terminais separados: `cd backend; npm install; npm run dev` e `cd frontend; npm install; npm run dev`. Localmente, a API usa a porta `3001`. Para validar: `cd frontend && npm run lint && npm run typecheck && npm run build`; `cd backend && npm test`. Os testes integrados do backend usam `TEST_MONGO_URI=mongodb://localhost:27017/ npm test` e criam/removem um banco temporário com nome aleatório.

## Administração

O painel autenticado usa `/dashboard`, `/convites`, `/padrinhos`, `/presentes` e `/pix`. Convites, Padrinhos e Presentes oferecem listagens com filtros e paginação, cadastro e edição em modais Material UI e confirmação de exclusão. As URLs de cadastro e edição continuam disponíveis e abrem o modal sobre a listagem, preservando os filtros ao fechar. A configuração PIX aceita uma chave válida e gera BR Code EMV com QR Code. O modal público Gravata Online aparece na página `/casamento` quando o PIX está ativo. As páginas públicas `/casamento` e `/invitation/:id/:name` continuam disponíveis; a confirmação individual de convidados permanece no convite.

O frontend novo fica em `frontend/src/components`, `pages`, `services`, `types` e `theme`. O código público continua em `frontend/src/main.jsx`; o CRUD de convites fica em `frontend/src/pages/Invitations` e compartilha o tema e os modais Material UI com os cadastros em TypeScript. Padrinhos e Presentes aceitam upload de imagens no painel e continuam exibindo URLs e imagens antigas.

## Imagens no Cloudflare R2

Crie um bucket R2 e um token limitado a leitura, gravação e exclusão de objetos desse bucket. Configure no backend as variáveis de `backend/.env.example`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` e, se necessário, `R2_ENDPOINT`. O endpoint padrão é `https://<account-id>.r2.cloudflarestorage.com`. Com Docker Compose, coloque as variáveis em um arquivo `.env` na raiz ou no ambiente do processo `docker compose`; `backend/.env` é usado apenas na execução local. Configure também `FRONTEND_URL` com a origem real do site quando não for `http://localhost:3002`, pois o backend restringe o CORS a essa origem. Nunca use variáveis `VITE_` para as credenciais.

Opcionalmente, configure `R2_PUBLIC_BASE_URL` com um domínio HTTPS próprio ligado ao bucket para servir os objetos por redirecionamento. Não use `r2.dev` em produção. Sem esse domínio, a API lê os objetos do bucket privado e os entrega por `/api/images/:id`. Nesse modo não é necessária configuração de CORS no R2; com domínio próprio, permita `GET` público para as imagens do catálogo e mantenha `PUT`/`DELETE` restritos ao token do backend. O frontend envia os arquivos para a API, por isso não precisa de permissão de upload no CORS do bucket.

O serviço aceita JPEG, PNG e WebP, valida o conteúdo, limita arquivos a 5 MB (10 MB para galeria), aplica orientação e redimensionamento e salva WebP sem metadados. O banco guarda metadados e uma referência estável. Uploads ainda não vinculados a um cadastro são limpos após 24 horas pelo processo do backend. Os módulos de convidados e galeria não possuem campo de foto na interface atual; as categorias de armazenamento estão preparadas para futura integração.

## Rotas da API

Admin: `GET/POST /api/invitations`, `GET/PUT/DELETE /api/invitations/:id`. Públicas: `GET /api/public/invitations/:id/:slug?token=...` e `POST /api/public/invitations/:id/confirm`.

Padrinhos: `GET/POST /api/godparents`, `GET/PUT/DELETE /api/godparents/:id`. Presentes: `GET/POST /api/gift-products`, `GET/PUT/DELETE /api/gift-products/:id`. Essas rotas exigem autenticação. Filtros de padrinhos: `name`, `role`, `active`, `page`, `limit`, `sortBy`, `sortOrder`. Filtros de presentes: `name`, `category`, `active`, `minPrice`, `maxPrice`, `page`, `limit`, `sortBy`, `sortOrder`.

PIX: `GET/PUT /api/pix/settings` exige autenticação; `GET /api/pix/status` informa se a configuração está ativa; `POST /api/pix/generate` recebe `{ "amount": 150 }` e retorna valor, BR Code e QR Code. Dados públicos de catálogo: `GET /api/public/godparents` e `GET /api/public/gift-products`.

Imagens: `POST /api/images` e `PUT /api/images/:id` recebem o arquivo binário com `Content-Type` da imagem, `X-Image-Category` no upload e `X-Original-Filename` codificado em URI. `DELETE /api/images/:id` remove uma imagem sem referências. Essas três operações exigem autenticação. `GET /api/images/:id` exibe apenas imagens vinculadas ao catálogo. Há limite de 60 uploads/substituições por 15 minutos.

A listagem aceita `name`, `status`, `startDate`, `endDate`, `page`, `limit`, `sortBy` e `sortOrder`. Respostas seguem `{ success, message, data }`; listagem inclui `pagination`.

Convites públicos são gerados pela interface após o cadastro, com slug e token aleatório não previsível. O token não é retornado pela consulta pública.
