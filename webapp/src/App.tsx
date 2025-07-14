import React, { useState, useEffect } from 'react';
import { initData, mainButton, backButton } from '@telegram-apps/sdk';
import { createClient } from '@supabase/supabase-js';
import StyleEditor from './components/StyleEditor';
import './App.css';

// Типы данных
interface UserStyle {
  id?: number;
  user_id: number;
  style_summary: string;
  positive_lexicon: string[];
  negative_lexicon: string[];
  writing_style: {
    tone: string;
    formality: string;
    emoji_usage: string;
    paragraph_length: string;
  };
  examples: string[];
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

function App() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [userStyle, setUserStyle] = useState<UserStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация Supabase
  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.REACT_APP_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Инициализация Telegram Web App
    try {
      const initDataParsed = initData.parse();
      
      if (initDataParsed?.user) {
        setUser(initDataParsed.user);
        loadUserStyle(initDataParsed.user.id);
      } else {
        setError('Не удалось получить данные пользователя');
        setLoading(false);
      }

      // Настройка кнопок Telegram
      mainButton.setParams({
        text: 'Сохранить изменения',
        isVisible: false
      });

      backButton.show();

    } catch (err) {
      console.error('Error initializing Telegram Web App:', err);
      setError('Ошибка инициализации Telegram Web App');
      setLoading(false);
    }
  }, []);

  const loadUserStyle = async (userId: number) => {
    try {
      setLoading(true);
      
      // Получаем стиль пользователя
      const { data, error } = await supabase
        .from('user_styles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setUserStyle(data);
      } else {
        // Создаем базовый стиль для нового пользователя
        const defaultStyle: UserStyle = {
          user_id: userId,
          style_summary: 'Нейтральный, информативный стиль с легкой дружелюбностью',
          positive_lexicon: ['отлично', 'прекрасно', 'замечательно', 'интересно'],
          negative_lexicon: ['шаблонно', 'банально', 'скучно'],
          writing_style: {
            tone: 'friendly',
            formality: 'casual',
            emoji_usage: 'moderate',
            paragraph_length: 'medium'
          },
          examples: []
        };
        setUserStyle(defaultStyle);
      }
    } catch (err) {
      console.error('Error loading user style:', err);
      setError('Ошибка при загрузке профиля стиля');
    } finally {
      setLoading(false);
    }
  };

  const saveUserStyle = async (updatedStyle: UserStyle) => {
    if (!user || !updatedStyle) return;

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('user_styles')
        .upsert(updatedStyle, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      setUserStyle(updatedStyle);
      
      // Показываем уведомление об успешном сохранении
      mainButton.setParams({
        text: 'Сохранено ✓',
        isVisible: true
      });

      setTimeout(() => {
        mainButton.setParams({
          text: 'Сохранить изменения',
          isVisible: false
        });
      }, 2000);

    } catch (err) {
      console.error('Error saving user style:', err);
      setError('Ошибка при сохранении профиля стиля');
    } finally {
      setSaving(false);
    }
  };

  const handleStyleChange = (updatedStyle: UserStyle) => {
    setUserStyle(updatedStyle);
    
    // Показываем кнопку сохранения
    mainButton.setParams({
      text: 'Сохранить изменения',
      isVisible: true
    });

    // Обработчик нажатия на главную кнопку
    mainButton.onClick(() => saveUserStyle(updatedStyle));
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загружаем ваш профиль стиля...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h3>Ошибка</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Редактор стиля</h1>
        {user && (
          <p className="user-info">
            Привет, {user.first_name}! Настрой свой авторский стиль.
          </p>
        )}
      </header>

      <main className="app-main">
        {userStyle && (
          <StyleEditor
            style={userStyle}
            onChange={handleStyleChange}
            saving={saving}
          />
        )}
      </main>
    </div>
  );
}

export default App; 