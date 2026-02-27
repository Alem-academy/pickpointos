# SIGEX Integration — PVZ OS

Документация по интеграции с сервисом электронной подписи [SIGEX](https://sigex.kz) для аутентификации через ЭЦП и подписания документов.

---

## Архитектура

```
Frontend (React)
    │
    ├── SigexService (src/services/sigex.ts)
    │       │
    │       └──► sigex-gateway (VPS: gateway.pvz.kz)
    │                   │
    │                   └──► sigex.kz/api  (внешний API SIGEX)
    │
    └── /auth/login/iin → parser Backend (Railway)
```

### Почему нужен gateway?

SIGEX API требует HTTPS и имеет ограничения по CORS. **sigex-gateway** — промежуточный Node.js/Express сервис, который:
- Проксирует запросы к `sigex.kz/api`
- Генерирует PDF-документы (pdf-lib) для подписания
- Парсит CMS-подписи для извлечения ИИН

---

## Потоки аутентификации

### 1. ЭЦП через eGov Mobile (QR-код)

Основной поток для входа сотрудников через мобильное приложение eGov:

```
1. GET  /api/auth/nonce          → SIGEX выдаёт nonce (случайная строка)
2. POST /api/sign/egovQr         → Создаём QR-сессию в SIGEX
3. POST /api/sign/egovQr/{id}/data → Отправляем base64(nonce) как данные для подписи
4. GET  /api/sign/egovQr/{id}    → Polling: ждём пока пользователь подпишет QR
     │
     └── statusRes.signatures[0] → base64 CMS-блок от eGov Mobile
5. POST /api/auth/parse-cms      → gateway парсит CMS, возвращает ИИН + ФИО
6. POST /auth/login/iin          → parser backend: создаёт JWT по ИИН
```

#### Ключевой момент: извлечение ИИН из CMS

CMS-подпись из eGov QR **нельзя** верифицировать через SIGEX `/api/auth` — она подписывает данные документа, а не nonce аутентификации.

**Решение:** прямой парсинг DER-буфера CMS. НУЦ РК встраивает ИИН в поле Subject сертификата как ASCII-строку `SERIALNUMBER=IIN<12цифр>`.

```js
// sigex-gateway/src/routes/auth.js — POST /auth/parse-cms
const buf   = Buffer.from(cms, 'base64');
const latin = buf.toString('latin1');
const match = latin.match(/IIN(\d{10,12})/);
// → "IIN910506350166"
```

Кириллические поля ФИО (CN, SURNAME, GIVENNAME) читаются как UTF8String из того же буфера.

---

### 2. ЭЦП через NCALayer (Desktop)

Для входа с ПК через приложение NCALayer:

```
1. GET  /api/auth/nonce          → Получаем nonce
2. NCALayer подписывает nonce    → возвращает base64 CMS
3. POST /api/auth/login          → gateway → sigex.kz/api/auth
     { nonce, signature, external: true }
     ← { userId, subject, ... }  — certInfo с ИИН
4. POST /auth/login/iin          → parser backend: JWT по ИИН
```

Для desktop потока CMS **подписывает сам nonce**, поэтому SIGEX `/api/auth` работает корректно.

---

### 3. Подписание документов (контракты)

```
1. POST /api/sign/document/generate  → gateway генерирует PDF из шаблона
     ← { data: "<base64 PDF>" }
2. POST /api/sign/egovQr             → Создаём QR-сессию с signMethod: CMS_WITH_DATA
     { description, documentsToSign: [{ id: documentId }] }
3. Пользователь сканирует QR и подписывает PDF
4. GET  /api/sign/egovQr/{id}        → Polling, получаем CMS-подпись
5. POST /api/sign/document/{id}/sign → Сохраняем подпись в SIGEX-документ
```

---

## Компоненты

### sigex-gateway (`/sigex-gateway`)

| Маршрут | Метод | Описание |
|---------|-------|----------|
| `/api/auth/nonce` | GET | Получить nonce для подписи |
| `/api/auth/login` | POST | Верифицировать подпись nonce (desktop ЭЦП) |
| `/api/auth/parse-cms` | POST | Извлечь ИИН + ФИО из CMS-буфера (QR ЭЦП) |
| `/api/sign/document` | POST | Зарегистрировать документ в SIGEX |
| `/api/sign/document/generate` | POST | Сгенерировать PDF из шаблона |
| `/api/sign/document/:id/sign` | POST | Добавить подпись к документу |
| `/api/sign/egovQr` | POST | Создать QR-сессию подписи |
| `/api/sign/egovQr/:id/data` | POST | Отправить данные для подписания |
| `/api/sign/egovQr/:id` | GET | Проверить статус и получить подписи |
| `/health` | GET | Health check |

**ENV переменные gateway:**
```env
SIGEX_API_URL=https://sigex.kz/api
PORT=8080
```

---

### Frontend — `SigexService` (`src/services/sigex.ts`)

```ts
SigexService.getAuthNonce()                    // GET /api/auth/nonce
SigexService.authenticate(nonce, signature)    // POST /api/auth/login  (desktop)
SigexService.registerQrSigning(description)    // POST /api/sign/egovQr
SigexService.sendQrData(operationId, data)     // POST /api/sign/egovQr/:id/data
SigexService.checkQrStatus(operationId)        // GET  /api/sign/egovQr/:id
SigexService.generatePdf(data)                 // POST /api/sign/document/generate
SigexService.registerDocument(data)            // POST /api/sign/document
SigexService.addSignature(docId, signature)    // POST /api/sign/document/:id/sign
```

**ENV фронтенда:**
```env
VITE_SIGEX_GATEWAY_URL=https://gateway.pvz.kz
```

---

### Backend — `POST /auth/login/iin` (`parser/src/routes/auth.js`)

Принимает ИИН (доверенный, из верифицированной ЭЦП), находит сотрудника в БД и выдаёт JWT.

```
POST /auth/login/iin
Body: { iin: "910506350166" }

→ 200 { found: true,  token: "...", user: { ... } }   — сотрудник найден
→ 200 { found: false }                                  — ИИН не в базе → /my-profile
→ 500                                                   — ошибка сервера
```

> **Важно:** возвращает HTTP 200 в обоих случаях found/not-found. HTTP 4xx вызывает exception в axios.

---

## Страница «Отказано в доступе»

Если ИИН не найден в таблице `employees`, пользователь перенаправляется на `/my-profile`:

```
/my-profile?iin=910506350166&name=ИБРАГИМОВ%20МИРЖАН
```

Страница показывает данные из сертификата ЭЦП (переданные как query params) и сообщение об отказе в доступе. БД при этом не запрашивается.

---

## Структура CMS-сертификата НУЦ РК

Сертификаты НУЦ РК (Национального Удостоверяющего Центра Казахстана) содержат в поле Subject:

| OID | Поле | Кодировка | Пример |
|-----|------|-----------|--------|
| `2.5.4.5` | SERIALNUMBER | PrintableString (ASCII) | `IIN910506350166` |
| `2.5.4.3` | CN (ФИО) | UTF8String | `ИБРАГИМОВ МИРЖАН` |
| `2.5.4.4` | SURNAME | UTF8String | `ИБРАГИМОВ` |
| `2.5.4.42` | GIVENNAME | UTF8String | `БЕКБОЛАТОВИЧ` |
| `2.5.4.6` | C | PrintableString | `KZ` |

Для юридических лиц SERIALNUMBER содержит `BIN<12 цифр>` вместо `IIN`.

---

## Частые ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `Invalid authentication nonce` | CMS из QR подписывает данные, не nonce auth-сессии | Использовать `parse-cms` (буферный парсинг), не `/api/auth` |
| `Could not extract userId` (пустые signatures) | Документ зарегистрирован, но `/data` не загружен | Для QR-потока использовать `parse-cms` |
| `Request failed with status code 404` | Backend возвращал 404 когда ИИН не в базе | Исправлено: теперь HTTP 200 + `{ found: false }` |
| `Не удалось извлечь ИИН из ЭЦП` | Устаревший подход через certInfo без IIN | Исправлено: буферный regex |
| `Long polling timeout` | Пользователь не подписал QR вовремя | Ограничен 25 попытками (≈2.5 мин), после — ошибка |

---

## Деплой gateway

Gateway развёрнут на VPS `195.49.215.116` в Docker.

```bash
# Собрать архив (без node_modules)
cd sigex-gateway
tar -czf ../gateway-deploy.tar.gz --exclude=node_modules --exclude=.git .

# Загрузить на VPS
scp gateway-deploy.tar.gz centos@195.49.215.116:/home/centos/gateway.tar.gz

# На VPS: распаковать и пересобрать
ssh centos@195.49.215.116 "sudo -i bash -c '
  cd /root/sigex-gateway && 
  tar -xzf /home/centos/gateway.tar.gz && 
  docker compose down sigex-gateway && 
  docker compose up -d --build
'"
```

Используй `./upload.exp` и `./fast_deploy.exp` скрипты в корне проекта для автоматического деплоя с паролем.

---

## Ссылки

- [SIGEX Документация](https://sigex.kz) — полная API документация в `/sigex.txt`
- [НУЦ РК](https://pki.gov.kz) — документация по структуре сертификатов
- [`sigex-gateway/src/routes/auth.js`](./sigex-gateway/src/routes/auth.js) — gateway auth маршруты
- [`sigex-gateway/src/routes/sign.js`](./sigex-gateway/src/routes/sign.js) — gateway sign маршруты
- [`src/services/sigex.ts`](./src/services/sigex.ts) — frontend SigexService
- [`src/pages/Login.tsx`](./src/pages/Login.tsx) — логика входа через ЭЦП
