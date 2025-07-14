import json
import os
import boto3
import requests
from typing import Dict, Any
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Инициализация AWS клиентов
secrets_manager = boto3.client('secretsmanager')

def get_secret(secret_name: str) -> str:
    """Получить секрет из AWS Secrets Manager"""
    try:
        response = secrets_manager.get_secret_value(SecretId=secret_name)
        return response['SecretString']
    except Exception as e:
        logger.error(f"Error getting secret {secret_name}: {e}")
        return os.environ.get(secret_name, '')

def send_telegram_message(bot_token: str, chat_id: int, text: str, parse_mode: str = None) -> Dict[str, Any]:
    """Отправка сообщения в Telegram"""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    payload = {
        'chat_id': chat_id,
        'text': text
    }
    
    # Добавляем parse_mode только если он указан
    if parse_mode:
        payload['parse_mode'] = parse_mode
    
    logger.info(f"Sending message to chat {chat_id}: {text[:200]}...")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        logger.info(f"Message sent successfully: {result.get('ok', False)}")
        return result
    except requests.exceptions.RequestException as e:
        logger.error(f"Error sending message to Telegram: {e}")
        logger.error(f"Response content: {getattr(e.response, 'text', 'No response')}")
        raise

def escape_markdown_v2(text: str) -> str:
    """Экранирование специальных символов для MarkdownV2"""
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    
    return text

def format_post_content(content: str) -> str:
    """Форматирование контента поста для Telegram MarkdownV2"""
    # Экранируем специальные символы MarkdownV2
    content = escape_markdown_v2(content)
    
    # Убеждаемся что контент не превышает лимит Telegram (4096 символов)
    if len(content) > 4000:
        content = content[:3997] + '\\.\\.\\.'
    
    return content

def lambda_handler(event, context):
    """Main Lambda handler для обработки SQS сообщений"""
    try:
        # Получаем bot token
        bot_token = get_secret('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN not found")
        
        # Обрабатываем каждое сообщение из SQS
        for record in event['Records']:
            try:
                # Парсим сообщение из SQS
                message_body = json.loads(record['body'])
                logger.info(f"Processing message: {message_body}")
                
                chat_id = message_body.get('chat_id')
                generated_content = message_body.get('generated_content', '')
                error_message = message_body.get('error_message')
                
                if not chat_id:
                    logger.error("No chat_id in message")
                    continue
                
                # Определяем что отправлять
                if error_message:
                    # Отправляем сообщение об ошибке
                    text = f"❌ Произошла ошибка при обработке: {error_message}"
                elif generated_content:
                    # Отправляем сгенерированный контент (пока без MarkdownV2)
                    text = generated_content
                    # Убеждаемся что контент не превышает лимит Telegram
                    if len(text) > 4000:
                        text = text[:3997] + '...'
                else:
                    # Отправляем уведомление о том, что обработка завершена
                    text = "✅ Обработка завершена, но контент не сгенерирован"
                
                # Отправляем сообщение (без parse_mode для отладки)
                result = send_telegram_message(bot_token, chat_id, text)
                logger.info(f"Message sent successfully: {result}")
                
            except Exception as e:
                logger.error(f"Error processing record {record}: {e}")
                # Для SQS Lambda функций, если возникает ошибка, 
                # сообщение будет возвращено в очередь для повторной обработки
                raise
        
        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'success'})
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise  # SQS будет повторно обрабатывать сообщение 