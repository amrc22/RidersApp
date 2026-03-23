FROM node:22-alpine AS builder
WORKDIR /app

COPY Backend/package*.json ./
RUN npm install

COPY Backend/tsconfig*.json ./
COPY Backend/nest-cli.json ./
COPY Backend/src ./src
COPY Backend/prisma ./prisma
COPY seed.json ../seed.json

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY Backend/package*.json ./
RUN npm install

COPY Backend/tsconfig.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /seed.json ../seed.json
COPY Backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "./docker-entrypoint.sh"]
