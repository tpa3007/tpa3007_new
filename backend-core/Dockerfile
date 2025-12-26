# Dockerfile

# Используем официальный образ Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем инструменты сборки (нужны для некоторых крипто-библиотек)
RUN apk add --no-cache python3 make g++ gcc musl-dev

# Копируем package.json
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Удаляем инструменты сборки для уменьшения размера образа
RUN apk del python3 make g++ gcc musl-dev

# Копируем остальные файлы проекта
COPY . .

# По умолчанию запускаем листенер, но это будет переопределено в docker-compose
CMD [ "node", "ton-listener.js" ]