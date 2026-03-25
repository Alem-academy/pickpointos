# План: Система управления шаблонами документов

## 📋 Проблема

Текущая система шаблонов имеет недостатки:
1. Шаблоны захардкожены в коде
2. Сложно обновлять - требует деплоя
3. Нет версионности
4. Нет предпросмотра
5. Нет локализации RU/KZ

## 🎯 Цель

Создать гибкую систему которая позволит:
- ✅ Хранить шаблоны отдельно от кода
- ✅ Обновлять без деплоя
- ✅ Вести историю версий
- ✅ Поддерживать RU/KZ
- ✅ Предпросмотр шаблонов
- ✅ Легко добавлять новые типы

## 🏗️ Архитектура (БД)

```sql
CREATE TABLE document_templates (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    language VARCHAR(2) DEFAULT 'ru',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(type, version, language)
);
```

## 📝 Этапы

### 1. Подготовка (1-2ч)
- Создать миграцию БД
- Перенести шаблоны

### 2. Backend API (2-3ч)
- GET /api/templates
- POST /api/templates
- PUT /api/templates/:id
- POST /api/templates/:id/preview

### 3. Frontend Admin (4-6ч)
- TemplateList.tsx
- TemplateEditor.tsx
- TemplatePreview.tsx

### 4. Тестирование (2-3ч)

**Итого: 9-14 часов**

## 🚀 MVP (4-5 часов)

1. Таблица БД (30 мин)
2. Перенос шаблонов (1ч)
3. Обновить backend (1ч)
4. Простой UI (2ч)
