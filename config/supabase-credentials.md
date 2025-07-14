# Supabase Credentials для Kriistina Bot

## 📋 Необходимые данные из Supabase Dashboard

### 1. Project Settings > API

Перейдите в проект → Settings → API и скопируйте:

```bash
# Project URL
SUPABASE_URL=https://your-project-ref.supabase.co

# Anon (public) key - для frontend
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key - для backend (СЕКРЕТНЫЙ!)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Project Reference (для CLI)
SUPABASE_PROJECT_REF=your-project-ref
```

### 2. Project Settings > Database

```bash
# Database URL (для прямых подключений)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres

# Host
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
```

## ⚠️ Безопасность

- **НИКОГДА** не коммитьте service_role_key в git
- Используйте anon_key только для frontend
- Service_role_key только для backend Lambda функций
- Храните пароли в AWS Secrets Manager

## 📍 Где использовать эти ключи

### AWS Secrets Manager (для Lambda)
- `SUPABASE_URL` → URL проекта  
- `SUPABASE_API_KEY` → service_role_key (для полного доступа)

### React App (.env файл)
- `REACT_APP_SUPABASE_URL` → URL проекта
- `REACT_APP_SUPABASE_ANON_KEY` → anon_key (только чтение через RLS) 