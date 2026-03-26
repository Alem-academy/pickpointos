# 📋 Activity Logging - История действий сотрудников

## ✅ Что реализовано

**Миграция 010:**
- Таблица `employee_activity_logs`
- Индексы для быстрого поиска
- JSONB для метаданных

**Backend:**
- Модуль `activityLogger.js`
- Endpoint `GET /employees/:id/activity`
- Автоматическое логирование генерации документов

**Frontend:**
- Timeline с иконками и цветами
- Отображение HR который выполнил действие
- Timestamp с точностью до минут

## 📊 Типы действий

| Тип | Категория | Иконка | Цвет | Описание |
|-----|-----------|--------|------|----------|
| `document_generated` | document | 📄 FileText | 🔵 Blue | Сформирован документ |
| `document_signed` | document | 📄 FileText | 🔵 Blue | Подписан документ |
| `transfer` | transfer | ➡️ MoveRight | 🟣 Purple | Перевод на ПВЗ |
| `status_changed` | status | ✏️ Edit2 | 🟠 Amber | Изменение статуса |
| `hired` | status | 👤 User | 🟢 Emerald | Принят на работу |

## 🔧 Как использовать

### Backend

```javascript
import { logActivity } from './lib/activityLogger.js';

// Логирование действия
await logActivity({
    employeeId: 'uuid',
    actionType: 'document_generated',
    actionCategory: 'document',
    title: 'Сформирован документ: Трудовой договор',
    description: 'Трудовой договор №001/26',
    metadata: { document_type: 'contract', document_id: 'uuid' },
    performedById: 'hr-uuid',
    performedByName: 'Иванова А.'
});
```

### Frontend

```tsx
import { HistoryTab } from '@/components/hr/profile/HistoryTab';

// В профиле сотрудника
<HistoryTab employeeId={id} hiredAt={employee.hired_at} />
```

## 📦 API

### GET /employees/:id/activity

**Ответ:**
```json
[
  {
    "id": "uuid",
    "employee_id": "uuid",
    "action_type": "document_generated",
    "action_category": "document",
    "title": "Сформирован документ: Трудовой договор",
    "description": "Трудовой договор",
    "metadata": {"document_type": "contract"},
    "performed_by_name": "Иванова А.",
    "created_at": "2026-03-26T14:30:00Z"
  }
]
```

**Параметры:**
- `limit` (optional): Количество записей (default: 50)

## 🎨 UI

```
┌─────────────────────────────────────────────┐
│ 📅 История сотрудника                       │
├─────────────────────────────────────────────┤
│                                             │
│  📄 Сформирован документ                    │
│     Трудовой договор №ТД-001/26            │
│     26 марта 2026, 14:30                   │
│     HR: Иванова А.                         │
│                                             │
│  ➡️ Перевод на другой ПВЗ                   │
│     Алматы → Астана                        │
│     25 марта 2026, 10:00                   │
│     HR: Петров Б.                          │
│                                             │
│  👤 Принят на работу                        │
│     ПВЗ: Алматы, ул. Жарокова              │
│     20 марта 2026, 09:00                   │
│     HR: Иванова А.                         │
│                                             │
└─────────────────────────────────────────────┘
```

## ⚠️ Важно

1. **Автоматическое логирование:**
   - ✅ Генерация документов (уже работает)
   - ⏳ Переводы (нужно добавить)
   - ⏳ Изменение статуса (нужно добавить)

2. **Очистка старых записей:**
   ```sql
   -- Удалять логи старше 2 лет
   DELETE FROM employee_activity_logs 
   WHERE created_at < NOW() - INTERVAL '2 years';
   ```

3. **Производительность:**
   - Индексы уже созданы
   - Лимит по умолчанию: 50 записей
   - JSONB для гибких метаданных

## 📝 Примеры метаданных

```json
// Документ
{
  "document_type": "contract",
  "document_id": "uuid"
}

// Перевод
{
  "from_pvz_id": "uuid",
  "from_pvz_name": "Алматы, ул. Жарокова",
  "to_pvz_id": "uuid",
  "to_pvz_name": "Астана, ул. Умай Ана"
}

// Статус
{
  "old_status": "new",
  "new_status": "active"
}
```

