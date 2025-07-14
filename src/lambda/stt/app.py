import json
import os
import boto3
import requests
import tempfile
from typing import Dict, Any, Optional
import logging
from openai import OpenAI

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Инициализация AWS клиентов
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

def download_telegram_file(bot_token: str, file_id: str, bucket_name: str) -> str:
    """Скачать файл из Telegram и сохранить в S3"""
    
    # Получаем информацию о файле
    file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile"
    response = requests.get(file_info_url, params={'file_id': file_id}, timeout=30)
    response.raise_for_status()
    
    file_info = response.json()
    file_path = file_info['result']['file_path']
    
    # Скачиваем файл
    download_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    file_response = requests.get(download_url, timeout=60)
    file_response.raise_for_status()
    
    # Сохраняем в S3
    s3_key = f"audio/{file_id}.ogg"
    s3.put_object(
        Bucket=bucket_name,
        Key=s3_key,
        Body=file_response.content,
        ContentType='audio/ogg'
    )
    
    logger.info(f"File saved to S3: {bucket_name}/{s3_key}")
    return s3_key

def transcribe_audio(openai_client: OpenAI, bucket_name: str, s3_key: str, language: Optional[str] = None) -> str:
    """Транскрибация аудио через OpenAI Whisper API"""
    
    # Скачиваем файл из S3 во временную папку
    with tempfile.NamedTemporaryFile(suffix='.ogg', delete=False) as temp_file:
        s3.download_fileobj(bucket_name, s3_key, temp_file)
        temp_file_path = temp_file.name
    
    try:
        # Открываем файл для транскрибации
        with open(temp_file_path, 'rb') as audio_file:
            transcript_params = {
                'file': audio_file,
                'model': 'whisper-1',
                'response_format': 'text'
            }
            
            # Добавляем язык если указан
            if language:
                transcript_params['language'] = language
            
            transcript = openai_client.audio.transcriptions.create(**transcript_params)
            
        logger.info(f"Transcription completed: {len(transcript)} characters")
        return transcript
        
    finally:
        # Удаляем временный файл
        os.unlink(temp_file_path)

def extract_url_content(url: str) -> str:
    """Извлечение основного контента из URL"""
    try:
        from readability import Document
        
        # Скачиваем страницу
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Извлекаем основной контент
        doc = Document(response.text)
        title = doc.title()
        content = doc.summary()
        
        # Удаляем HTML теги (простая очистка)
        import re
        content_clean = re.sub('<[^<]+?>', '', content)
        
        result = f"Заголовок: {title}\n\nКонтент:\n{content_clean}"
        
        # Ограничиваем размер (до 8000 символов для GPT)
        if len(result) > 8000:
            result = result[:7997] + '...'
        
        logger.info(f"URL content extracted: {len(result)} characters")
        return result
        
    except Exception as e:
        logger.error(f"Error extracting URL content: {e}")
        return f"Ошибка при извлечении контента из URL: {url}"

def lambda_handler(event, context):
    """Main Lambda handler для STT обработки"""
    try:
        logger.info(f"Received event: {event}")
        
        # Получаем параметры из Step Functions
        user_id = event.get('user_id')
        chat_id = event.get('chat_id')
        content_type = event.get('content_type')
        content_data = event.get('content_data', {})
        bucket_name = event.get('bucket_name')
        
        if not all([user_id, chat_id, content_type, bucket_name]):
            raise ValueError("Missing required parameters")
        
        # Получаем секреты
        bot_token = get_secret('TELEGRAM_BOT_TOKEN')
        openai_api_key = get_secret('OPENAI_API_KEY')
        
        if not bot_token or not openai_api_key:
            raise ValueError("Missing required secrets")
        
        # Инициализируем OpenAI клиент
        openai_client = OpenAI(api_key=openai_api_key)
        
        # Обрабатываем контент в зависимости от типа
        processed_text = ""
        
        if content_type in ['voice', 'audio']:
            # Скачиваем аудио файл
            file_id = content_data.get('file_id')
            if not file_id:
                raise ValueError("No file_id for audio content")
            
            s3_key = download_telegram_file(bot_token, file_id, bucket_name)
            
            # Транскрибируем
            processed_text = transcribe_audio(openai_client, bucket_name, s3_key)
            
        elif content_type == 'text':
            processed_text = content_data.get('text', '')
            
        elif content_type == 'url':
            url = content_data.get('url', '')
            processed_text = extract_url_content(url)
            
        else:
            raise ValueError(f"Unsupported content type: {content_type}")
        
        # Возвращаем результат для следующего шага Step Functions
        result = {
            'user_id': user_id,
            'chat_id': chat_id,
            'content_type': content_type,
            'processed_text': processed_text,
            'bucket_name': bucket_name,
            'supabase_url': event.get('supabase_url'),
            'supabase_key': event.get('supabase_key')
        }
        
        logger.info(f"STT processing completed: {len(processed_text)} characters")
        return result
        
    except Exception as e:
        logger.error(f"STT processing error: {e}")
        # Возвращаем ошибку для Step Functions
        return {
            'error': str(e),
            'chat_id': event.get('chat_id'),
            'user_id': event.get('user_id')
        } 