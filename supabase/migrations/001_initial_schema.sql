-- Создаем таблицу для профилей стиля пользователей
create table public.user_styles (
    id bigserial primary key,
    user_id bigint not null unique,
    style_summary text not null default 'Нейтральный, информативный стиль',
    positive_lexicon text[] default '{}',
    negative_lexicon text[] default '{}',
    writing_style jsonb default '{
        "tone": "neutral",
        "formality": "casual", 
        "emoji_usage": "moderate",
        "paragraph_length": "medium"
    }'::jsonb,
    examples text[] default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создаем таблицу для истории генерации
create table public.generation_history (
    id bigserial primary key,
    user_id bigint not null,
    original_content text not null,
    generated_content text not null,
    content_type text default 'text',
    processing_time_ms integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создаем таблицу для пользователей (расширение для управления подписками)
create table public.users (
    id bigserial primary key,
    telegram_user_id bigint not null unique,
    username text,
    first_name text,
    last_name text,
    language_code text default 'ru',
    subscription_tier text default 'free' check (subscription_tier in ('free', 'premium')),
    subscription_expires_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Создаем таблицу для множественных слотов стиля (premium feature)
create table public.style_slots (
    id bigserial primary key,
    user_id bigint not null references public.users(telegram_user_id),
    slot_name text not null,
    style_summary text not null,
    positive_lexicon text[] default '{}',
    negative_lexicon text[] default '{}',
    writing_style jsonb default '{
        "tone": "neutral",
        "formality": "casual",
        "emoji_usage": "moderate", 
        "paragraph_length": "medium"
    }'::jsonb,
    examples text[] default '{}',
    is_active boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, slot_name)
);

-- Создаем индексы для производительности
create index idx_user_styles_user_id on public.user_styles(user_id);
create index idx_generation_history_user_id on public.generation_history(user_id);
create index idx_generation_history_created_at on public.generation_history(created_at);
create index idx_users_telegram_user_id on public.users(telegram_user_id);
create index idx_style_slots_user_id on public.style_slots(user_id);
create index idx_style_slots_active on public.style_slots(user_id, is_active) where is_active = true;

-- Row Level Security будет настроен позже через Dashboard
-- Для начала используем service_role ключ в Lambda функциях для полного доступа
-- RLS можно включить позже через Supabase Dashboard с кастомными политиками

-- Создаем функцию для обновления updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Создаем триггеры для автоматического обновления updated_at
create trigger handle_updated_at_user_styles
    before update on public.user_styles
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_users
    before update on public.users  
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_style_slots
    before update on public.style_slots
    for each row execute function public.handle_updated_at();

-- Создаем функцию для получения активного стиля пользователя
create or replace function public.get_active_user_style(p_user_id bigint)
returns table (
    style_summary text,
    positive_lexicon text[],
    negative_lexicon text[],
    writing_style jsonb,
    examples text[]
) as $$
begin
    -- Сначала проверяем активный слот
    return query
    select 
        ss.style_summary,
        ss.positive_lexicon,
        ss.negative_lexicon,
        ss.writing_style,
        ss.examples
    from public.style_slots ss
    where ss.user_id = p_user_id and ss.is_active = true
    limit 1;
    
    -- Если нет активного слота, возвращаем основной стиль
    if not found then
        return query
        select 
            us.style_summary,
            us.positive_lexicon,
            us.negative_lexicon,
            us.writing_style,
            us.examples
        from public.user_styles us
        where us.user_id = p_user_id;
    end if;
end;
$$ language plpgsql security definer;

-- Даем права на выполнение функции
grant execute on function public.get_active_user_style(bigint) to authenticated;
grant execute on function public.get_active_user_style(bigint) to anon; 