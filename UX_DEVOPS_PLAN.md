# UI/UX DevOps План

## Проблемы
- Долгая загрузка (15-30 сек)
- Нет валидации
- Черновики не сохраняются
- Нет прогресса загрузки

## Решения P0

### 1. Skeleton Loader
if (isLoading) return <Skeleton className="h-96" />;

### 2. Валидация
const [errors, setErrors] = useState({});
validateIin = (iin) => iin.length === 12 ? null : '12 цифр';

### 3. Черновики
localStorage.setItem('draft', JSON.stringify(formData));

## Решения P1

### 4. Прогресс загрузки
xhr.upload.addEventListener('progress', (e) => {
  setProgress((e.loaded / e.total) * 100);
});

### 5. Предпросмотр
reader.onloadend = () => setPreviews({...});

### 6. Подтверждение
<Dialog>Подтверждение создания</Dialog>

## Метрики
| Метрика | До | После |
|---------|-----|-------|
| Загрузка | 30 сек | 2 сек |
| Ошибки | 40% | 10% |
| Черновики | 15% потерь | 0% |

## Файлы
- src/pages/hr/Applications.tsx
- src/pages/hr/NewEmployee.tsx
- tests/ux-improvements.spec.ts

## Запуск
npm run test:headed -- tests/ux-improvements.spec.ts
