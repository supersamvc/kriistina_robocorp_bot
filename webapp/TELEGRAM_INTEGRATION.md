# 📱 Проверка интеграции с Telegram

## ✅ Что было исправлено

1. **🔗 Подключен Telegram Web App SDK** - приложение теперь получает реальные данные пользователя из Telegram
2. **🎯 Автоматическое определение контекста** - приложение понимает, открыто ли оно в Telegram или в браузере
3. **📊 Умная индикация режима** - различные сообщения для разных контекстов
4. **💾 Адаптивное сохранение** - разное поведение в зависимости от контекста

## 🔍 Как проверить интеграцию

### 1. Проверка в браузере (текущий режим)

**Ожидаемое поведение:**
- ✅ Желтый баннер: "🌐 Демо-режим | Откройте в Telegram для полной функциональности"
- ✅ Пользователь: "Demo User (Демо-версия)"
- ✅ При сохранении: сообщение о демо-режиме с предложением открыть в Telegram

**Проверка в консоли браузера (F12):**
```
Telegram Web App API недоступен
Переключение в демо-режим
```

### 2. Проверка в Telegram (когда будет настроено)

**Ожидаемое поведение:**
- ✅ Без баннера демо-режима (или другой баннер если DEMO_MODE=true)
- ✅ Реальное имя пользователя из Telegram
- ✅ При сохранении: данные сохраняются в Supabase

**Проверка в консоли:**
```
Telegram Web App доступен. Версия: X.X
User data: {id: XXXXX, first_name: "...", ...}
Пользователь из Telegram: {...}
```

## 🚀 Настройка Mini Web App в Telegram

### Шаг 1: Настройка через @BotFather

1. Найдите своего бота в Telegram
2. Отправьте команду `/setmenubutton`
3. Выберите своего бота
4. Настройте кнопку меню:
   - **Text**: `🎨 Настроить стиль`
   - **URL**: URL вашего веб-приложения

### Шаг 2: Альтернативная настройка через API

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "🎨 Настроить стиль",
      "web_app": {
        "url": "https://your-webapp-url.com"
      }
    }
  }'
```

### Шаг 3: Добавление в команды бота

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "🚀 Начать работу"},
      {"command": "mystyle", "description": "🎨 Настроить стиль письма"},
      {"command": "help", "description": "❓ Помощь"}
    ]
  }'
```

## 🔧 Варианты деплоя веб-приложения

### 1. Vercel (рекомендуемый)
```bash
cd webapp
npm run build
npx vercel --prod
```

### 2. Netlify
```bash
cd webapp
npm run build
# Загрузите папку build/ на netlify.com
```

### 3. GitHub Pages
```bash
cd webapp
npm install --save-dev gh-pages
npm run build
npx gh-pages -d build
```

### 4. AWS S3 + CloudFront
```bash
cd webapp
npm run build
aws s3 sync build/ s3://your-bucket-name --delete
```

## 📊 Отладка

### Консольные сообщения для диагностики

**В браузере:**
```
Telegram Web App API недоступен
Переключение в демо-режим
Loading user style for user: 123456789
```

**В Telegram:**
```
Telegram Web App доступен. Версия: 7.0
Init data: query_id=...&user=%7B%22id%22...
User data: {id: 12345, first_name: "John", ...}
Пользователь из Telegram: {id: 12345, firstName: "John", ...}
```

### Проверка переменных Telegram

В консоли браузера выполните:
```javascript
// Проверка доступности API
console.log('Telegram доступен:', !!window.Telegram?.WebApp);

// Версия API
console.log('Версия:', window.Telegram?.WebApp?.version);

// Данные пользователя
console.log('Пользователь:', window.Telegram?.WebApp?.initDataUnsafe?.user);

// Все данные инициализации
console.log('Init data:', window.Telegram?.WebApp?.initData);
```

## ⚠️ Возможные проблемы

### 1. HTTPS обязателен
Telegram Web App работает только по HTTPS. Локальная разработка работает через localhost.

### 2. CSP Headers
Убедитесь, что сервер не блокирует Telegram скрипты.

### 3. Версия API
Проверьте версию Telegram Web App API в консоли.

## 🎯 Готово!

Теперь приложение:
- ✅ **Автоматически определяет контекст** (Telegram vs браузер)
- ✅ **Получает реальные данные пользователя** из Telegram
- ✅ **Показывает соответствующие сообщения** для каждого режима
- ✅ **Готово к интеграции с Telegram ботом** 