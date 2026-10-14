# --- Этап 1: Сборка зависимостей и билда ---
FROM node:22-alpine AS builder
WORKDIR /app

# Копируем только файлы конфигурации зависимостей
COPY package.json package-lock.json ./

# ВАЖНО: Используем npm ci вместо npm install для строгой сборки по lock-файлу
RUN npm ci

# Копируем исходный код
COPY . .

# Переменные окружения
ENV NEXT_PUBLIC_API_URL=http://localhost:9000/api/v1

# Собираем Next.js проект
RUN npm run build

# --- Этап 2: Запуск (Production Image) ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Создаем непривилегированного пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем статику
COPY --from=builder /app/public ./public
RUN mkdir .next

# Копируем оптимизированную standalone-сборку
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключаемся на безопасного пользователя
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запускаем сервер
CMD ["node", "server.js"]