# UI/UX Улучшения для флоу найма

## План работ

### P0 - Критично (сделать сейчас)

1. Skeleton loader для канбана
2. Валидация полей с обратной связью
3. Сохранение черновиков в localStorage

### P1 - Важно (следующий спринт)

4. Индикатор загрузки документов
5. Предпросмотр файлов
6. Подтверждение создания

### P2 - Желательно (бэклог)

7. Объединение шагов (2 вместо 3)
8. Поиск ПВЗ
9. Горячие клавиши

## Метрики

| Метрика | Сейчас | Цель |
|---------|--------|------|
| Загрузка канбана | 15-30 сек | < 2 сек |
| Заполнение формы | ~3 мин | < 1 мин |
| Загрузка документов | ~10 сек | < 3 сек |
| Ошибки валидации | 40% | < 10% |

## Код улучшений

### 1. Skeleton Loader
const { isLoading } = useQuery({...});
if (isLoading) return <Skeleton className="h-96" />;

### 2. Валидация
const [errors, setErrors] = useState({});
validateIin = (iin) => iin.length === 12 ? null : '12 цифр';

### 3. Черновики
useEffect(() => {
  localStorage.setItem('draft', JSON.stringify(formData));
}, [formData]);

### 4. Прогресс загрузки
xhr.upload.addEventListener('progress', (e) => {
  setProgress((e.loaded / e.total) * 100);
});

### 5. Предпросмотр
reader.onloadend = () => {
  setPreviews({ [type]: reader.result });
};

## Запуск

npm run dev - тестирование
npm run build - проверка bundle
