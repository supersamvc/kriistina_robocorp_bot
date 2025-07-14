import json
import os
import boto3
from typing import Dict, Any, List, Optional
import logging
from openai import OpenAI
from supabase import create_client, Client

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

def get_user_style_profile(supabase: Client, user_id: int) -> Optional[Dict[str, Any]]:
    """Получить профиль стиля пользователя из Supabase"""
    try:
        # Сначала пробуем получить существующий профиль
        response = supabase.table('user_styles').select('*').eq('user_id', user_id).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Found existing style profile for user {user_id}")
            return response.data[0]
        else:
            # Если профиль не найден, создаем базовый
            logger.info(f"No style profile found for user {user_id}, creating default")
            return create_default_style_profile(supabase, user_id)
            
    except Exception as e:
        logger.error(f"Error getting user style profile: {e}")
        # В случае ошибки возвращаем базовый профиль
        return create_default_style_profile(supabase, user_id)

def create_default_style_profile(supabase: Client, user_id: int) -> Dict[str, Any]:
    """Создать базовый профиль стиля для нового пользователя"""
    default_profile = {
        'user_id': user_id,
        'style_summary': 'Нейтральный, информативный стиль с легкой дружелюбностью',
        'positive_lexicon': ['отлично', 'прекрасно', 'замечательно', 'интересно'],
        'negative_lexicon': ['шаблонно', 'банально', 'скучно'],
        'writing_style': {
            'tone': 'friendly',
            'formality': 'casual',
            'emoji_usage': 'moderate',
            'paragraph_length': 'medium'
        },
        'examples': []
    }
    
    try:
        # Попытка вставить новый профиль в базу
        response = supabase.table('user_styles').insert(default_profile).execute()
        if response.data and len(response.data) > 0:
            logger.info(f"Created new style profile for user {user_id}")
            return response.data[0]
        else:
            logger.warning(f"Insert returned no data for user {user_id}, using default")
            return default_profile
    except Exception as e:
        logger.error(f"Error creating default style profile: {e}")
        # Если не удалось создать в базе, возвращаем локальный профиль
        logger.info(f"Using local default profile for user {user_id}")
        return default_profile

def build_style_prompt(style_profile: Dict[str, Any], processed_text: str) -> str:
    """Построить промпт для GPT с учетом стиля пользователя"""
    
    style_summary = style_profile.get('style_summary', 'Нейтральный стиль')
    positive_words = style_profile.get('positive_lexicon', [])
    negative_words = style_profile.get('negative_lexicon', [])
    writing_style = style_profile.get('writing_style', {})
    examples = style_profile.get('examples', [])
    
    prompt = f"""Ты - AI-копирайтер, который должен написать пост в специфическом авторском стиле.

СТИЛЬ АВТОРА:
{style_summary}

ПРЕДПОЧИТАЕМЫЕ СЛОВА И ВЫРАЖЕНИЯ:
{', '.join(positive_words) if positive_words else 'Не указаны'}

ИЗБЕГАТЬ СЛОВ:
{', '.join(negative_words) if negative_words else 'Не указаны'}

ХАРАКТЕРИСТИКИ СТИЛЯ:
- Тон: {writing_style.get('tone', 'neutral')}
- Формальность: {writing_style.get('formality', 'casual')}
- Использование эмодзи: {writing_style.get('emoji_usage', 'moderate')}
- Длина абзацев: {writing_style.get('paragraph_length', 'medium')}

ПРИМЕРЫ ПОСТОВ АВТОРА:
{chr(10).join([f"- {example}" for example in examples[:3]]) if examples else 'Примеры не предоставлены'}

ЗАДАЧА:
Преобразуй следующий контент в пост, написанный в указанном стиле автора. 
Пост должен быть оформлен в Markdown V2 для Telegram (поддерживаются: *жирный*, _курсив_, `код`, [ссылка](url)).

ИСХОДНЫЙ КОНТЕНТ:
{processed_text}

ТРЕБОВАНИЯ К ПОСТУ:
1. Максимум 4000 символов
2. Структурированный и читаемый
3. Соответствует авторскому стилю
4. Использует эмодзи умеренно
5. Форматирование Markdown V2

ПОСТ:"""
    
    return prompt

def generate_post_content(openai_client: OpenAI, style_profile: Dict[str, Any], processed_text: str) -> str:
    """Генерация контента поста через GPT-4"""
    
    prompt = build_style_prompt(style_profile, processed_text)
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system", 
                    "content": "Ты - опытный копирайтер, который умеет писать в разных авторских стилях. Всегда отвечай только готовым постом без дополнительных комментариев."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=3000,
            temperature=0.7
        )
        
        generated_content = response.choices[0].message.content.strip()
        logger.info(f"Generated post: {len(generated_content)} characters")
        
        return generated_content
        
    except Exception as e:
        logger.error(f"Error generating content with OpenAI: {e}")
        raise

def save_generated_content(supabase: Client, user_id: int, content: str, original_text: str) -> None:
    """Сохранить сгенерированный контент в истории"""
    try:
        history_record = {
            'user_id': user_id,
            'original_content': original_text[:1000],  # Ограничиваем размер
            'generated_content': content,
            'content_type': 'generated_post'
        }
        
        response = supabase.table('generation_history').insert(history_record).execute()
        if response.data:
            logger.info(f"Content saved to history for user {user_id}")
        else:
            logger.warning(f"History insert returned no data for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error saving content to history: {e}")
        # Не прерываем выполнение, если история не сохранилась

def lambda_handler(event, context):
    """Main Lambda handler для генерации постов"""
    try:
        logger.info(f"Received event: {event}")
        
        # Получаем параметры из Step Functions
        user_id = event.get('user_id')
        chat_id = event.get('chat_id')
        processed_text = event.get('processed_text', '')
        supabase_url = event.get('supabase_url') or os.environ.get('SUPABASE_URL')
        supabase_key = event.get('supabase_key') or get_secret('SUPABASE_API_KEY')
        
        if not all([user_id, chat_id, processed_text, supabase_url, supabase_key]):
            raise ValueError("Missing required parameters")
        
        # Получаем секреты
        openai_api_key = get_secret('OPENAI_API_KEY')
        if not openai_api_key:
            raise ValueError("Missing OpenAI API key")
        
        # Инициализируем клиентов
        openai_client = OpenAI(api_key=openai_api_key)
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Получаем профиль стиля пользователя
        style_profile = get_user_style_profile(supabase, user_id)
        if not style_profile:
            raise ValueError("Could not get user style profile")
        
        # Генерируем контент
        generated_content = generate_post_content(openai_client, style_profile, processed_text)
        
        # Сохраняем в историю
        save_generated_content(supabase, user_id, generated_content, processed_text)
        
        # Возвращаем результат для отправки в SQS
        result = {
            'chat_id': chat_id,
            'user_id': user_id,
            'generated_content': generated_content,
            'original_text': processed_text[:500]  # Краткая версия для логов
        }
        
        logger.info(f"Post generation completed for user {user_id}")
        return result
        
    except Exception as e:
        logger.error(f"Post generation error: {e}")
        # Возвращаем ошибку для отправки пользователю
        return {
            'error': str(e),
            'chat_id': event.get('chat_id'),
            'user_id': event.get('user_id'),
            'error_message': f"Ошибка при генерации поста: {str(e)}"
        } 