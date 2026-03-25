# Система управления шаблонами документов - Complete

## ✅ Реализованный функционал

### 1. База данных
- ✅ Таблица `document_templates` с версионностью
- ✅ Поддержка RU/KZ языков
- ✅ Переменные шаблонов в JSONB
- ✅ Индексы для производительности

### 2. Backend API
- ✅ `GET /api/templates` - Список шаблонов с фильтрами
- ✅ `GET /api/templates/:id` - Получение шаблона
- ✅ `GET /api/templates/type/:type/default` - Шаблон по умолчанию
- ✅ `POST /api/templates` - Создание шаблона
- ✅ `PUT /templates/:id` - Обновление шаблона
- ✅ `DELETE /templates/:id` - Удаление (soft delete)
- ✅ `POST /templates/:id/preview` - Предпросмотр с данными
- ✅ `GET /api/templates/types` - Список типов документов

### 3. Frontend Admin UI
- ✅ Страница `/hr/templates` для управления шаблонами
- ✅ Фильтрация по типу и языку
- ✅ Редактор HTML шаблонов
- ✅ Предпросмотр в iframe
- ✅ Статусы (Активен, По умолчанию)

### 4. Интеграция с документами
- ✅ Автоподстановка реквизитов юрлица
- ✅ Поддержка 3 юридических лиц
- ✅ Переменные {{employer_name}}, {{employer_bin}} и др.

---

## 📁 Файлы

### Backend
| Файл | Описание |
|------|----------|
| `parser/src/migrations/007_add_employers_table.sql` | Юрлица |
| `parser/src/migrations/008_add_document_templates_table.sql` | Шаблоны |
| `parser/src/routes/templates.js` | API routes |
| `parser/src/routes/documents.js` | Генерация документов |
| `parser/src/services/templates.js` | HTML шаблоны |

### Frontend
| Файл | Описание |
|------|----------|
| `src/pages/hr/Templates.tsx` | Admin UI страница |
| `src/routes.tsx` | Роутинг |
| `src/components/layout/Sidebar.tsx` | Навигация |

---

## 🚀 Как использовать

### 1. Запуск миграций
```bash
cd parser
npm start
# Миграции применятся автоматически
```

### 2. Доступ к Admin UI
1. Войдите как HR или Admin
2. Перейдите в sidebar: **Шаблоны**
3. URL: `http://localhost:5173/hr/templates`

### 3. Создание шаблона
1. Нажмите "+ Новый шаблон"
2. Выберите тип документа
3. Заполните название и описание
4. Вставьте HTML с переменными `{{variable}}`
5. Нажмите "Предпросмотр" для проверки
6. Сохраните

### 4. Переменные в шаблонах

**Для всех документов:**
- `{{employer_name}}` - Название юрлица
- `{{employer_address}}` - Адрес
- `{{employer_director}}` - Директор

**Для сотрудников:**
- `{{full_name}}` - ФИО
- `{{iin}}` - ИИН
- `{{position}}` - Должность

**Специфичные переменные:**
Смотрите поле `variables` в каждом шаблоне.

---

## 📊 API Примеры

### Получить все шаблоны
```bash
curl http://localhost:8080/api/templates
```

### Получить шаблоны конкретного типа
```bash
curl http://localhost:8080/api/templates?type=vacation_order&language=ru
```

### Создать новый шаблон
```bash
curl -X POST http://localhost:8080/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "type": "vacation_application",
    "version": "1.0",
    "name": "Заявление на отпуск v1",
    "description": "Шаблон для отпуска",
    "content": "<html>...</html>",
    "language": "ru",
    "is_default": true
  }'
```

### Предпросмотр
```bash
curl -X POST http://localhost:8080/api/templates/:id/preview \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "full_name": "Иванов Иван",
      "iin": "000101000000",
      "employer_name": "ИП Жасмин"
    }
  }'
```

---

## 🏢 Юридические лица

| № | Название | БИН/ИИН | Банк |
|---|----------|---------|------|
| 1 | ИП «Жасмин» | 910729401967 | Kaspi Bank |
| 2 | ИП «Ориентал» | 881212402575 | Kaspi Bank |
| 3 | ТОО «PVZ.kz» | 250540026389 | Freedom Bank |

---

## 🔧 Конфигурация

### Добавить новое юрлицо
```sql
INSERT INTO employers (
    name_full, name_short, bin, iin,
    director_name, director_name_dative,
    address_legal, bank_name, bik
) VALUES (
    'ТОО «Новое»',
    'Новое',
    '123456789012',
    NULL,
    'Директоров Д.Д.',
    'Директорову Д.Д.',
    'г. Алматы, ул. Примерная 1',
    'АО «Bank»',
    'BANKKZKA'
);
```

### Изменить шаблон по умолчанию
```sql
UPDATE document_templates 
SET is_default = TRUE 
WHERE type = 'contract' AND version = '2.0';
-- Автоматически снимет is_default с других версий
```

---

## 📝 Планы на будущее

### MVP (Завершено ✅)
- [x] Хранение шаблонов в PostgreSQL
- [x] Версионность шаблонов
- [x] Поддержка RU/KZ
- [x] API для CRUD операций
- [x] Admin UI для управления
- [x] Multi-entity support (3 юрлица)

### Следующие итерации
- [ ] Массовая загрузка шаблонов из DOCX
- [ ] Экспорт шаблонов в DOCX/PDF
- [ ] История изменений шаблонов (audit log)
- [ ] A/B тестирование шаблонов
- [ ] Статистика использования шаблонов
- [ ] Уведомления об истечении срока договора

---

## 🐛 Troubleshooting

### Миграция не применяется
```bash
# Проверить статус миграций
psql -c "SELECT * FROM migrations;"

# Применить вручную
cd parser
node scripts/run-migrations.js
```

### Шаблоны не отображаются
1. Проверить API: `GET /api/templates`
2. Проверить логи backend
3. Убедиться что `is_active = TRUE`

### Ошибка предпросмотра
- Убедиться что HTML валидный
- Проверить что переменные существуют в `variables` array

---

## 📞 Контакты

По вопросам обращайтесь к команде разработки AlemLab.
