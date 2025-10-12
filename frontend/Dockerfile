FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN chmod +x /app/entrypoint.sh || true

EXPOSE 5173

CMD ["/bin/sh", "/app/entrypoint.sh"]