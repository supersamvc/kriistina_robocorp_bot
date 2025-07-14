# 🛠️ AWS Setup - Пошаговая настройка

## ✅ Статус проверки:
- ✅ **AWS CLI установлен**: v2.27.50
- ✅ **SAM CLI установлен**: v1.142.1
- ❌ **Credentials не настроены** - требуется настройка

## 🎯 План настройки:

### Шаг 1: Создание/вход в AWS аккаунт
1. Перейдите на https://aws.amazon.com/
2. Нажмите **"Sign In to the Console"** (если есть аккаунт) или **"Create an AWS Account"**

**Если создаете новый аккаунт:**
- Потребуется email, пароль
- Выберите тип аккаунта: **Personal**
- Введите платежную информацию (карта)
- Подтвердите телефон
- Выберите план: **Basic support - Free**

### Шаг 2: Создание IAM пользователя для CLI
1. В AWS Console найдите сервис **IAM**
2. Перейдите в **Users** → **Create user**
3. Имя пользователя: `kriistina-bot-deploy`
4. **Access type**: ✅ Programmatic access
5. **Permissions**: Attach existing policies directly
6. Добавьте политики:
   - ✅ `PowerUserAccess` (или `AdministratorAccess` для простоты)
7. **Create user**
8. **ВАЖНО**: Скопируйте и сохраните:
   - **Access Key ID**: `AKIA...`
   - **Secret Access Key**: `...` (показывается один раз!)

### Шаг 3: Настройка AWS CLI
Вернитесь в терминал и выполните:
```bash
aws configure
```

Введите данные из предыдущего шага:
- **AWS Access Key ID**: [вставьте ваш Access Key ID]
- **AWS Secret Access Key**: [вставьте ваш Secret Access Key]  
- **Default region name**: `us-east-1`
- **Default output format**: `json`

### Шаг 4: Проверка настройки
```bash
aws sts get-caller-identity
```

Должен показать примерно:
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/kriistina-bot-deploy"
}
```

## 🎯 После успешной настройки

Когда credentials настроены, сможем развернуть проект:
```bash
# 1. Установка SAM CLI (если нужно)
pip install aws-sam-cli

# 2. Сборка проекта
sam build

# 3. Развертывание
sam deploy --guided
```

## ❓ Проблемы?

### "Access denied" ошибки
- Убедитесь что у пользователя есть права PowerUserAccess
- Или добавьте AdministratorAccess (временно)

### "Invalid credentials"  
- Проверьте что правильно скопировали Access Key ID и Secret
- Повторите `aws configure`

### "Region not found"
- Используйте стандартные регионы: `us-east-1`, `us-west-2`, `eu-west-1`

## 📞 Готовы продолжить?
Создайте AWS аккаунт и IAM пользователя, затем сообщите - настроим credentials в терминале! 