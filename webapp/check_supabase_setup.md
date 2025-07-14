# Проверка настроек Supabase

## 1. Проверьте RLS (Row Level Security)
В Supabase Dashboard перейдите в:
Table Editor → user_styles → Settings → Row Level Security

Если RLS включен, но нет политик доступа, отключите его временно:
```sql
ALTER TABLE public.user_styles DISABLE ROW LEVEL SECURITY;
```

## 2. Проверьте существование таблицы
В SQL Editor выполните:
```sql
SELECT * FROM user_styles LIMIT 1;
```

## 3. Тестовая вставка данных  
Если таблица пуста, добавьте тестовые данные:
```sql
INSERT INTO user_styles (user_id, style_summary) 
VALUES (123456789, 'Тестовый стиль') 
ON CONFLICT (user_id) DO NOTHING;
```

## 4. После настройки переменных окружения
1. Перезапустите React приложение: `npm start`
2. Откройте Developer Tools (F12) → Console
3. Проверьте ошибки подключения к Supabase
