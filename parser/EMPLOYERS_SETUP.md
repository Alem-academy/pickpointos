# Multi-Entity Support (Юрлица)

## Overview

The system now supports multiple legal entities (юрлица) for document generation. Each employee is linked to a specific legal entity, and documents are automatically generated with the correct employer requisites.

## Legal Entities

| ID | Name | BIN/ИИН | Director | Address | Bank | BIK |
|----|------|---------|----------|---------|------|-----|
| 1 | ИП «Жасмин» | ИИН: 910729401967 | Карабаева Г.Е. | г. Алматы, Бурундайская, дом 93 А | АО «Kaspi Bank» | CASPKZKA |
| 2 | ИП «Ориентал» | ИИН: 881212402575 | Карабаева Г.Е. | г. Алматы, ул. Хакимжанова 12 | АО «Kaspi Bank» | CASPKZKA |
| 3 | ТОО «PVZ.kz» | БИН: 250540026389 | Карабаева Г.Е. | г. Астана, проспект Кабанбай Батыр, дом 40, ВП 28 | АО «Freedom Bank» | - |

## Database Schema

### employers table

```sql
CREATE TABLE employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_full VARCHAR(255) NOT NULL,
    name_short VARCHAR(100),
    bin VARCHAR(12),          -- For TOOs
    iin VARCHAR(12),          -- For IPs
    director_name VARCHAR(255) NOT NULL,
    director_name_dative VARCHAR(255),  -- For "Директору X" forms
    address_legal TEXT,
    bank_name VARCHAR(255),
    bik VARCHAR(8),
    iban VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### employees.employer_id

```sql
ALTER TABLE employees 
ADD COLUMN employer_id UUID REFERENCES employers(id);
```

## Migration

Run the migration to add employers support:

```bash
cd parser

# Option 1: Migrations run automatically on server start
npm start

# Option 2: Run migrations manually
node scripts/run-migrations.js
```

## How It Works

### 1. Employee Creation

When creating a new employee, assign them to a legal entity:

```javascript
await api.createEmployee({
    full_name: "Иванов Иван",
    iin: "000101000000",
    employer_id: "uuid-of-employer", // Optional, defaults to ИП «Жасмин»
    // ... other fields
});
```

### 2. Document Generation

When generating a document, the system automatically:
1. Fetches the employee's employer requisites from the database
2. Fills template variables with employer data
3. Generates the document with correct company name, BIN/IIN, address, etc.

```javascript
// Documents are generated with correct employer data automatically
await api.generateDocument(employeeId, 'vacation_order');
```

### 3. Template Variables

All document templates now use these employer variables:

- `{{employer_name}}` - Full legal name (e.g., "ИП «Жасмин»")
- `{{employer_short_name}}` - Short name (e.g., "Жасмин")
- `{{employer_bin}}` - BIN or IIN
- `{{employer_director}}` - Director name (e.g., "Карабаева Г.Е.")
- `{{employer_director_dative}}` - Director in dative case (e.g., "Карабаевой Г.Е.")
- `{{employer_address}}` - Legal address
- `{{employer_bank}}` - Bank name
- `{{employer_bik}}` - Bank BIK code
- `{{employer_iban}}` - Bank IBAN

## API Changes

### GET /employees/:id

Now includes employer data:

```json
{
    "id": "uuid",
    "full_name": "Иванов Иван",
    "employer_id": "uuid",
    "employer_name": "ИП «Жасмин»",
    "employer_bin": null,
    "employer_iin": "910729401967",
    // ... other fields
}
```

### POST /documents/generate

No changes needed - employer data is automatically included based on employee's `employer_id`.

## Fallback Behavior

If an employee has no `employer_id` or the employer is not found:
- System defaults to **ИП «Жасмин»** (ИИН: 910729401967)
- This ensures backward compatibility with existing employees

## Files Modified

- `parser/src/migrations/007_add_employers_table.sql` - Migration file
- `parser/src/services/templates.js` - Updated templates to use variables
- `parser/src/routes/documents.js` - Updated API to fetch employer data
- `parser/scripts/run-migrations.js` - Manual migration runner
