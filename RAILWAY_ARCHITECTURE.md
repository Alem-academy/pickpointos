# 🚂 Railway Архитектура

## ✅ Backend работает!

**URL:** https://pickpointos-production.up.railway.app  
**Status:** ✅ OK (health check passed)  
**Last Deploy:** 15 часов назад

## 📋 Конфигурация

### Backend Service (Node.js)

**Путь:** `/parser`  
**Порт:** 8080  
**Файл:** `parser/src/index.js`

**Что делает:**
- ✅ API endpoints (`/api/documents/*`, `/api/employees/*`)
- ✅ Генерация HTML документов
- ✅ PostgreSQL connection
- ✅ S3/Cloudflare R2 storage
- ✅ Serve static files из `/dist`

**Переменные окружения (Railway):**
```bash
DATABASE_URL=postgresql://...
PORT=8080
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT=https://8c40e3d415db0d9f25ae472273a44fe5.r2.cloudflarestorage.com
AWS_BUCKET_NAME=pickpointos
AWS_REGION=auto
```

### Frontend (React Vite)

**Собирается в:** `/dist`  
**API URL:** https://pickpointos-production.up.railway.app

**Переменные для build (`.env.production`):**
```bash
VITE_API_URL=https://pickpointos-production.up.railway.app
VITE_SIGEX_GATEWAY_URL=https://gateway.pvz.kz
```

## 🔧 Как работает деплой

### 1. Frontend Build

```bash
npm run build
# Создает /dist с index.html, JS, CSS
# Vite "запекает" VITE_API_URL в JS бандл
```

### 2. Backend Start

```bash
node parser/src/index.js
# Слушает PORT (8080)
# Serve static files из /dist
# API endpoints: /api/*
```

### 3. Railway Deploy

```
Git Push → Railway Detects Changes → 
npm install → npm run build → 
Start: node parser/src/index.js
```

## 📊 Endpoints

**Backend API:**
- `GET /health` → "OK"
- `POST /api/documents/generate` → генерация документов
- `GET /api/documents/:id/content` → контент документа
- `DELETE /api/documents/:id` → удаление
- `GET /api/employees` → список сотрудников
- `POST /api/employees` → создание
- `GET /api/pvz` → список ПВЗ
- `GET /api/employers` → список юрлиц

**Frontend Routes:**
- `/hr/employees` → список сотрудников
- `/hr/employees/:id` → профиль
- `/hr/new-employee` → создание
- `/hr/applications` → воронка найма

## 🔍 Debug

### Проверка Backend

```bash
# Health check
curl https://pickpointos-production.up.railway.app/health
# Ответ: OK

# API test
curl https://pickpointos-production.up.railway.app/api/pvz
# Ответ: [{"id": "...", "name": "...", ...}]
```

### Проверка Frontend

```bash
# Откройте браузер
https://pickpointos-production.up.railway.app

# Откройте DevTools → Network
# Кликните "Просмотр" документа
# Проверьте запрос:
GET /api/documents/:id/content
Status: 200 OK
Response: {scan_url: "...", content: "<html>...", type: "html"}
```

## ⚠️ Частые проблемы

### 1. Frontend не видит API

**Проблема:** `VITE_API_URL` не тот  
**Решение:** Обновить `.env.production` и пересобрать

```bash
# Проверить в браузере
console.log(import.meta.env.VITE_API_URL)
# Должно быть: https://pickpointos-production.up.railway.app
```

### 2. Backend не деплоится

**Проблема:** Нет новых коммитов  
**Решение:** Сделать тестовый коммит

```bash
echo "// deploy trigger" >> parser/src/index.js
git add -A && git commit -m "ci: trigger deploy

Co-authored-by: Qwen-Coder <qwen-coder@alibabacloud.com>" && git push
```

### 3. 503 ошибка API

**Проблема:** Backend crashed  
**Решение:** Проверить логи Railway

```
Railway → Backend → Deployments → View Logs
Искать: "Error:", "Crash:", "Exception:"
```

## 📦 Структура проекта

```
/
├── parser/              # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.js     # Main server
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── lib/         # DB, logger, etc.
│   └── package.json
├── src/                 # Frontend (React + Vite)
│   ├── components/
│   ├── pages/
│   └── services/
├── dist/                # Built frontend (created by npm run build)
├── .env.production      # Production env vars
└── Dockerfile           # Build & deploy config
```

## 🎯 Checklist для деплоя

- [ ] Backend работает (`/health` → OK)
- [ ] Frontend собран (`npm run build` → success)
- [ ] `VITE_API_URL` правильный
- [ ] База данных подключена
- [ ] S3 бакет доступен
- [ ] Логи чистые (нет ошибок)

