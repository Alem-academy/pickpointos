# Руководство по переводам сотрудников

## Типы перемещений

### 1. Временная замена (Short-term Replacement)

**Когда используется:**
- Сотрудник на ПВЗ А заболел/ушел в отпуск
- Сотрудник с ПВЗ Б подменяет его на несколько дней/недель
- Подмена на время обучения

**Процесс:**
1. HR создает временное назначение через `current_pvz_id`
2. **Юрлицо НЕ меняется** - сотрудник остается в своем ИП/ТОО
3. **Договор НЕ перезаключается** - действует старый договор
4. Сотрудник работает на другом ПВЗ, но оформлен в своем юрлице

**Пример:**
```
Сотрудник: Иванов И.И.
Основной ПВЗ: Алматы, ул. Жарокова (ИП Жасмин)
Временная замена: Астана, ул. Умай Ана (ИП Ориентал)
→ Юрлицо: ИП Жасмин (не меняется)
→ Договор: действует старый
```

**API:**
```javascript
// Временное назначение
PATCH /employees/:id
{
  "current_pvz_id": "uuid-нового-ПВЗ"
}

// Возврат на основной ПВЗ
PATCH /employees/:id
{
  "current_pvz_id": null
}
```

---

### 2. Постоянный перевод (Permanent Transfer)

**Когда используется:**
- Сотрудник переводится на другой ПВЗ навсегда
- Новый ПВЗ принадлежит другому юрлицу
- Требуется переоформление трудового договора

**Процесс:**
1. HR создает заявку на расторжение (`contract_terminations`)
2. Генерируется приказ об увольнении/расторжении
3. Генерируется новый трудовой договор с новым юрлицом
4. После подписания - обновляется `main_pvz_id`
5. **Юрлицо меняется автоматически** (триггер)

**Пример:**
```
Сотрудник: Петров П.П.
Откуда: Алматы, ул. Жарокова (ИП Жасмин)
Куда: Астана, пр. Кабанбай Батыр (ТОО PVZ.kz)
→ Расторжение с ИП Жасмин
→ Новый договор с ТОО PVZ.kz
```

**API:**
```javascript
// 1. Создать заявку на расторжение
POST /employees/:id/transfer
{
  "to_pvz_id": "uuid-нового-ПВЗ",
  "termination_date": "2026-04-01",
  "reason": "Перевод на другой ПВЗ"
}

// 2. Сгенерировать документы
POST /documents/generate
{
  "employeeId": "...",
  "type": "termination_order"
}

POST /documents/generate
{
  "employeeId": "...",
  "type": "contract"
}

// 3. После подписания - обновить main_pvz_id
PATCH /employees/:id
{
  "main_pvz_id": "uuid-нового-ПВЗ"
}
```

---

## Сравнение процессов

| Аспект | Временная замена | Постоянный перевод |
|--------|-----------------|-------------------|
| **Поле** | `current_pvz_id` | `main_pvz_id` |
| **Юрлицо** | Не меняется | Меняется автоматически |
| **Договор** | Не меняется | Расторжение + новый |
| **Документы** | Не требуются | Приказ + договор |
| **Срок** | Временный (дни/недели) | Постоянный |
| **Подтверждение** | Не требуется | Требуется approval |

---

## SQL View: Сотрудники на замене

```sql
-- Показать всех сотрудников на временной замене
SELECT * FROM employees_on_assignment;

-- Результат:
-- id | full_name | main_pvz_name | current_pvz_name | main_employer | assignment_type
```

---

## Сценарии использования

### Сценарий 1: Срочная замена на 1 день

**Проблема:** На ПВЗ "Алматы, Жарокова" сотрудник заболел, нужна замена на сегодня.

**Решение:**
```javascript
// Назначить замену
await hrApi.updateEmployee(substituteId, {
  current_pvz_id: sickEmployee.main_pvz_id
});

// Вечером вернуть обратно
await hrApi.updateEmployee(substituteId, {
  current_pvz_id: null
});
```

**Документы:** Не требуются ✅

---

### Сценарий 2: Перевод в другой город

**Проблема:** Сотрудник переезжает из Алматы в Астану на постоянку.

**Решение:**
```javascript
// 1. Создать заявку на расторжение
const termination = await hrApi.createTransfer(employeeId, {
  to_pvz_id: newPvzId,
  termination_date: '2026-04-01'
});

// 2. Сгенерировать приказ об увольнении
await hrApi.generateDocument(employeeId, 'termination_order');

// 3. Сгенерировать новый договор
await hrApi.generateDocument(employeeId, 'contract');

// 4. После подписания обновить main_pvz_id
await hrApi.updateEmployee(employeeId, {
  main_pvz_id: newPvzId
});
```

**Документы:** Приказ + Новый договор ✅

---

## Важные замечания

1. **Триггер `trg_update_employee_employer`** обновляет `employer_id` ТОЛЬКО при изменении `main_pvz_id`

2. **Временная замена** через `current_pvz_id` НЕ влияет на `employer_id`

3. **Генерация документов** всегда использует `employer_id` сотрудника, а не ПВЗ

4. **View `employees_on_assignment`** показывает кто где работает прямо сейчас

---

## Проверка

```sql
-- Кто сейчас на временной замене?
SELECT * FROM employees_on_assignment;

-- Кто в каком юрлице?
SELECT 
  e.full_name,
  emp.name_short as employer,
  pvz.name as pvz,
  CASE 
    WHEN e.current_pvz_id IS NOT NULL THEN 'Временная замена'
    ELSE 'Основное место'
  END as status
FROM employees e
JOIN pvz_points pvz ON e.main_pvz_id = pvz.id
JOIN employers emp ON e.employer_id = emp.id;
```
