FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# So as dependencias de producao (mongodb-memory-server e supertest ficam para os testes do CI).
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
