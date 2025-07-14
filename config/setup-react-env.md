# 📱 Настройка React Mini Web App

## Создание .env файла

Создайте файл `webapp/.env` со следующим содержимым:

```bash
# Скопируйте и вставьте эти строки в webapp/.env
REACT_APP_SUPABASE_URL=https://tucxcwjbexxdepgfzyif.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Y3hjd2piZXh4ZGVwZ2Z6eWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0Njk0MzcsImV4cCI6MjA2ODA0NTQzN30.YpS23ry6AKc3YwA45grCoy5JwvN36kz43UQLak6X680
```

## Команды для создания файла

### macOS/Linux:
```bash
cd webapp
cat > .env << 'EOF'
REACT_APP_SUPABASE_URL=https://tucxcwjbexxdepgfzyif.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Y3hjd2piZXh4ZGVwZ2Z6eWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0Njk0MzcsImV4cCI6MjA2ODA0NTQzN30.YpS23ry6AKc3YwA45grCoy5JwvN36kz43UQLak6X680
EOF
```

### Windows:
```cmd
cd webapp
echo REACT_APP_SUPABASE_URL=https://tucxcwjbexxdepgfzyif.supabase.co > .env
echo REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Y3hjd2piZXh4ZGVwZ2Z6eWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0Njk0MzcsImV4cCI6MjA2ODA0NTQzN30.YpS23ry6AKc3YwA45grCoy5JwvN36kz43UQLak6X680 >> .env
```

## Тестирование локально

```bash
cd webapp
npm install
npm start
```

React приложение откроется на http://localhost:3000

## ⚠️ Важно

- **.env файл НЕ коммитить в git!** (он уже в .gitignore)
- **anon_key безопасен** для frontend - он работает только через Row Level Security
- Для production деплоя эти переменные нужно настроить на хостинге 