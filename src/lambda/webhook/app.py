import json
import os
import boto3
import hashlib
import hmac
from typing import Dict, Any
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Инициализация AWS клиентов
stepfunctions = boto3.client('stepfunctions')
s3 = boto3.client('s3')
secrets_manager = boto3.client('secretsmanager')

def get_secret(secret_name: str) -> str:
    """Получить секрет из AWS Secrets Manager"""
    try:
        response = secrets_manager.get_secret_value(SecretId=secret_name)
        return response['SecretString']
    except Exception as e:
        logger.error(f"Error getting secret {secret_name}: {e}")
        return os.environ.get(secret_name, '')

def verify_telegram_webhook(token: str, headers: Dict[str, str], body: str) -> bool:
    """Верификация webhook от Telegram"""
    secret_token = headers.get('X-Telegram-Bot-Api-Secret-Token', '')
    if not secret_token:
        return False
    
    # Проверяем токен в пути
    telegram_bot_token = get_secret('TELEGRAM_BOT_TOKEN')
    if not token or token != telegram_bot_token.split(':')[0]:
        return False
    
    return True

def process_telegram_update(update: Dict[str, Any]) -> Dict[str, Any]:
    """Обработка обновления от Telegram и подготовка данных для Step Functions"""
    
    message = update.get('message', {})
    chat_id = message.get('chat', {}).get('id')
    user_id = message.get('from', {}).get('id')
    
    # Определяем тип контента
    content_type = None
    content_data = {}
    
    if 'voice' in message:
        content_type = 'voice'
        content_data = {
            'file_id': message['voice']['file_id'],
            'duration': message['voice'].get('duration', 0),
            'mime_type': message['voice'].get('mime_type', 'audio/ogg')
        }
    elif 'audio' in message:
        content_type = 'audio'
        content_data = {
            'file_id': message['audio']['file_id'],
            'duration': message['audio'].get('duration', 0),
            'mime_type': message['audio'].get('mime_type', 'audio/mp3')
        }
    elif 'text' in message:
        text = message['text']
        if text.startswith('http://') or text.startswith('https://'):
            content_type = 'url'
            content_data = {'url': text}
        else:
            content_type = 'text'
            content_data = {'text': text}
    else:
        raise ValueError("Unsupported message type")
    
    return {
        'user_id': user_id,
        'chat_id': chat_id,
        'message_id': message.get('message_id'),
        'content_type': content_type,
        'content_data': content_data,
        'timestamp': message.get('date'),
        'bucket_name': os.environ.get('CONTENT_BUCKET_NAME', ''),
        'supabase_url': os.environ.get('SUPABASE_URL', ''),
        'supabase_key': os.environ.get('SUPABASE_API_KEY', '')
    }

def lambda_handler(event, context):
    """Main Lambda handler"""
    try:
        # Получаем токен из пути
        path_params = event.get('pathParameters', {})
        token = path_params.get('token', '')
        
        # Получаем headers и body
        headers = event.get('headers', {})
        body = event.get('body', '{}')
        
        # Верификация webhook
        if not verify_telegram_webhook(token, headers, body):
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        # Парсинг update от Telegram
        update = json.loads(body)
        logger.info(f"Received update: {update}")
        
        # Обработка update и подготовка данных
        step_input = process_telegram_update(update)
        
        # Запуск Step Functions
        state_machine_arn = os.environ.get('PROCESSING_STATE_MACHINE_ARN')
        if not state_machine_arn:
            raise ValueError("PROCESSING_STATE_MACHINE_ARN not set")
        
        response = stepfunctions.start_execution(
            stateMachineArn=state_machine_arn,
            input=json.dumps(step_input)
        )
        
        logger.info(f"Started Step Functions execution: {response['executionArn']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'processing', 'execution_arn': response['executionArn']})
        }
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': str(e)})
        }
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        } 