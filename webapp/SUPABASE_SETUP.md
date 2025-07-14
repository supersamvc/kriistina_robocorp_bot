# 🔧 Настройка Supabase для веб-приложения

## ✅ Решение проблемы "Ошибка при загрузке профиля стиля"

**Причина ошибки:** В файле `.env` стоят placeholder-значения вместо реальных данных Supabase.

## 🎯 Быстрое решение - Демо-режим

**Сейчас приложение работает в демо-режиме** с тестовыми данными. Вы можете:
- Просматривать интерфейс редактора стиля
- Редактировать настройки (изменения не сохраняются в базу)
- Тестировать функционал

## 🚀 Настройка реального Supabase

### Шаг 1: Создайте проект Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **"Start your project"**
3. Войдите через GitHub (или создайте аккаунт)
4. Нажмите **"New project"**
5. Выберите организацию и введите данные:
   - **Name**: `kriistina-bot`
   - **Database Password**: создайте надежный пароль
   - **Region**: выберите ближайший к вам
6. Нажмите **"Create new project"**

⏱️ *Создание проекта займет 1-2 минуты*

### Шаг 2: Получите данные подключения

После создания проекта:

1. **Перейдите в Settings → API**
2. **Скопируйте данные:**
   - **Project URL** (например: `https://abcdefg.supabase.co`)
   - **Project API keys → anon public** (длинный ключ начинающийся с `eyJ...`)

### Шаг 3: Создайте таблицы базы данных

1. **Перейдите в SQL Editor**
2. **Создайте новый запрос** и вставьте код:

```sql
-- Создаем таблицу для профилей стиля пользователей
create table public.user_styles (
    id bigserial primary key,
    user_id bigint not null unique,
    style_summary text not null default 'Нейтральный, информативный стиль',
    positive_lexicon text[] default '{}',
    negative_lexicon text[] default '{}',
    writing_style jsonb default '{
        "tone": "neutral",
        "formality": "casual", 
        "emoji_usage": "moderate",
        "paragraph_length": "medium"
    }'::jsonb,
    examples text[] default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создаем индекс для производительности
create index idx_user_styles_user_id on public.user_styles(user_id);

-- Отключаем RLS для простоты (в продакшене включите)
ALTER TABLE public.user_styles DISABLE ROW LEVEL SECURITY;
```

3. **Нажмите RUN** для выполнения

### Шаг 4: Обновите файл .env

Откройте файл `webapp/.env` и замените значения:

```env
# Замените на ваши реальные данные из Supabase Dashboard
REACT_APP_SUPABASE_URL=https://ваш-проект-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Удалите эту строку для выхода из демо-режима
# REACT_APP_DEMO_MODE=true
```

**Важно:** Удалите или закомментируйте строку `REACT_APP_DEMO_MODE=true`

### Шаг 5: Перезапустите приложение

```bash
# Остановите текущий процесс (Ctrl+C в терминале)
# Затем запустите снова:
npm start
```

## ✅ Проверка работы

После настройки:

1. **Обновите страницу** в браузере
2. **Демо-баннер должен исчезнуть**
3. **Данные должны сохраняться** в базу Supabase
4. **Проверьте в браузере** Developer Tools → Console - не должно быть ошибок

## 🔍 Устранение проблем

### Ошибка подключения к Supabase

**Проверьте:**
- Правильность URL и API ключа
- Отсутствие лишних символов при копировании
- Таблица `user_styles` создана в базе данных

### RLS ошибки

Если видите ошибки Row Level Security:
```sql
-- В SQL Editor выполните:
ALTER TABLE public.user_styles DISABLE ROW LEVEL SECURITY;
```

### Проверка данных

В Table Editor можете увидеть сохраненные стили:
```sql
SELECT * FROM user_styles;
```

## 🎉 Готово!

Теперь ваше приложение подключено к реальной базе данных Supabase и может:
- Сохранять профили стиля
- Загружать данные между сессиями
- Работать с несколькими пользователями 