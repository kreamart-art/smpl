# SMPL — single service: Express serves the JSON API + the built React SPA.
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
# The SQLite file lives in /app/server — mount a volume there (or set SMPL_DB_PATH).
EXPOSE 5191
CMD ["node", "server/index.js"]
