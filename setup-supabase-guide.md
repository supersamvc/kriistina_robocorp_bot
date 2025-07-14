# 🗄️ Пошаговая настройка Supabase для Kriistina Bot

## ✅ Выполненные шаги

1. ✅ Supabase CLI установлен
2. ✅ Проект инициализирован в директории

## 🔄 Следующие шаги

### Шаг 1: Получите Project Reference из Supabase Dashboard

1. Откройте ваш проект на [app.supabase.com](https://app.supabase.com)
2. Перейдите в **Settings → General**
3. Скопируйте **Reference ID** (выглядит как `abcdefghijklmnop`)

### Шаг 2: Подключите CLI к проекту

```bash
# Замените YOUR_PROJECT_REF на ваш реальный Reference ID
supabase link --project-ref YOUR_PROJECT_REF
```

**При запросе пароля** введите database password, который вы создавали при создании проекта.

### Шаг 3: Примените миграции

После успешного подключения:

```bash
# Применить все миграции к удаленной базе
supabase db push
```

### Шаг 4: Проверьте результат

```bash
# Проверить статус миграций
supabase migration list

# Проверить состояние базы (опционально)
supabase db status
```

## 🎯 Ожидаемый результат

После выполнения всех команд в вашей Supabase базе будут созданы:

- ✅ Таблица `user_styles` - для профилей стиля пользователей
- ✅ Таблица `generation_history` - для истории генерации
- ✅ Таблица `users` - для управления пользователями
- ✅ Таблица `style_slots` - для множественных слотов стиля (premium)
- ✅ RLS политики для безопасности
- ✅ Функция `get_active_user_style()` для получения активного стиля

## 🔑 Получение API ключей

После применения миграций:

1. Перейдите в **Settings → API**
2. Скопируйте:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon key**: для frontend (React app)
   - **Service role key**: для backend (Lambda функции) - **СЕКРЕТНЫЙ!**

## ⚠️ Важные заметки

- **Service role key** обходит RLS - используйте только в Lambda функциях
- **Anon key** работает через RLS - безопасен для frontend
- Пароль базы данных храните в безопасном месте
- Все ключи позже добавим в AWS Secrets Manager

## 🐛 Решение проблем

### Ошибка "Invalid project ref"
- Проверьте правильность project reference
- Убедитесь что у вас есть доступ к проекту

### Ошибка аутентификации
- Проверьте правильность database password
- Попробуйте сбросить пароль в Settings → Database

### Ошибки миграций
- Проверьте наличие файла `supabase/migrations/001_initial_schema.sql`
- Убедитесь что syntax SQL корректен

## 📞 Готовы к следующему шагу?

После успешного применения миграций сообщите, и мы:
1. Настроим аутентификацию для Telegram
2. Интегрируем с Lambda функциями
3. Подготовим переменные окружения 