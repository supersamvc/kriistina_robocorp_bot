# 🔑 AWS Setup - Настройка для развертывания

## ⚠️ ВНИМАНИЕ: Нужны AWS Credentials

Проект технически готов, но для развертывания требуется ваш AWS аккаунт и credentials.

## 📋 Что нужно получить:

### 1. AWS Аккаунт
Если у вас нет AWS аккаунта:
- Перейдите на https://aws.amazon.com/
- Нажмите "Create Account"
- Следуйте инструкциям (потребуется кредитная карта)

### 2. AWS Access Keys
В AWS Console:
1. Перейдите в **IAM** → **Users**
2. Создайте нового пользователя или выберите существующего
3. **Security credentials** → **Create access key**
4. Выберите **"CLI, SDK, & API access"**
5. Скачайте или запишите:
   - **Access Key ID**: `AKIA...`
   - **Secret Access Key**: `...`

### 3. Необходимые права (IAM Permissions)
Пользователь должен иметь права на:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:*",
                "apigateway:*",
                "iam:*",
                "cloudformation:*",
                "s3:*",
                "sqs:*",
                "states:*",
                "logs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🛠️ Настройка AWS CLI

### Установка AWS CLI
```bash
# macOS
brew install awscli

# или через pip
pip install awscli
```

### Конфигурация credentials
```bash
aws configure

# Введите когда попросит:
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Default region name: us-east-1
# Default output format: json
```

### Проверка настройки
```bash
# Проверьте что credentials работают
aws sts get-caller-identity

# Должен показать ваш User ARN
```

## 💰 Примерная стоимость

### AWS Lambda
- **Бесплатный tier**: 1M запросов/месяц
- **После**: ~$0.20 за 1M запросов
- **Наш бот**: ~$5-15/месяц при активном использовании

### Другие сервисы
- **API Gateway**: ~$3.50 за 1M запросов
- **S3**: ~$0.023/GB для хранения аудио
- **SQS**: Первые 1M запросов бесплатно
- **CloudWatch Logs**: ~$0.50/GB

**Общая оценка**: $10-30/месяц в зависимости от нагрузки

## 🚀 После настройки AWS

Когда у вас будут credentials:
```bash
# 1. Проверьте что AWS CLI работает
aws sts get-caller-identity

# 2. Разверните проект
sam build
sam deploy --guided

# 3. Получите webhook URL и настройте Telegram
```

## 🔐 Альтернативы развертыванию

Если не хотите настраивать AWS сейчас:

### 1. AWS CloudShell
- Зайдите в AWS Console
- Откройте CloudShell (встроенный терминал)
- Загрузите проект туда
- Развертывайте прямо из консоли

### 2. AWS CodeStar / Amplify
- Более простой интерфейс
- Автоматическое управление правами

### 3. Другие платформы
- **Railway**: Простое развертывание
- **Render**: Хороший бесплатный tier
- **DigitalOcean Functions**: Аналог Lambda

## ❓ Вопросы?
- Есть ли у вас AWS аккаунт?
- Нужна ли помощь с настройкой credentials?
- Рассмотреть альтернативные платформы? 