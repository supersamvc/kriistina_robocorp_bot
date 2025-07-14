import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import StyleEditor from './components/StyleEditor';
import './App.css';

// Типы для Telegram Web App
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        ready(): void;
        expand(): void;
        MainButton: {
          show(): void;
          hide(): void;
          setText(text: string): void;
          onClick(callback: () => void): void;
        };
        version: string;
      };
    };
  }
}

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
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

function App() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [userStyle, setUserStyle] = useState<UserStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация Supabase
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  // Проверяем наличие переменных окружения
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables:', {
      REACT_APP_SUPABASE_URL: !!supabaseUrl,
      REACT_APP_SUPABASE_ANON_KEY: !!supabaseKey
    });
  }
  
  const supabase = createClient(supabaseUrl || '', supabaseKey || '');

  useEffect(() => {
    // Инициализация Telegram Web App
    const initializeTelegramApp = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('Telegram Web App доступен. Версия:', tg.version);
        console.log('Init data:', tg.initData);
        console.log('User data:', tg.initDataUnsafe.user);
        
        // Уведомляем Telegram что приложение готово
        tg.ready();
        tg.expand();
        
        // Получаем данные пользователя из Telegram
        const telegramUser = tg.initDataUnsafe.user;
        
        if (telegramUser) {
          const user: TelegramUser = {
            id: telegramUser.id,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            username: telegramUser.username,
            languageCode: telegramUser.language_code
          };
          
          console.log('Пользователь из Telegram:', user);
          setUser(user);
          loadUserStyle(user.id);
          return true;
        } else {
          console.warn('Данные пользователя Telegram недоступны');
          return false;
        }
      } else {
        console.warn('Telegram Web App API недоступен');
        return false;
      }
    };
    
    // Пытаемся инициализировать Telegram Web App
    const telegramInitialized = initializeTelegramApp();
    
    // Если Telegram недоступен, используем демо-режим
    if (!telegramInitialized) {
      console.log('Переключение в демо-режим');
      const demoUser: TelegramUser = {
        id: 123456789,
        firstName: 'Demo User',
        username: 'demo_user'
      };
      
      setUser(demoUser);
      
      // Проверяем принудительный демо-режим
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        loadDemoUserStyle();
      } else {
        loadUserStyle(demoUser.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDemoUserStyle = () => {
    setLoading(true);
    setError(null);
    
    console.log('Loading demo user style');
    
    // Симулируем загрузку данных
    setTimeout(() => {
      const demoStyle: UserStyle = {
        id: 1,
        user_id: 123456789,
        style_summary: '🎯 Современный, живой стиль с яркими метафорами и личными инсайтами. Использую эмодзи для акцентов, пишу доступно, но глубоко.',
        positive_lexicon: [
          'невероятно', 'потрясающе', 'вдохновляющий', 'breakthrough',
          'game-changer', 'инсайт', 'озарение', 'трансформация'
        ],
        negative_lexicon: [
          'банально', 'скучно', 'очевидно', 'избито',
          'шаблонно', 'попса', 'мейнстрим'
        ],
        writing_style: {
          tone: 'enthusiastic',
          formality: 'casual',
          emoji_usage: 'frequent',
          paragraph_length: 'short'
        },
        examples: [
          '🚀 Сегодня понял: успех — это не финишная черта, а качество бега. Когда мы перестаем думать о результате и фокусируемся на процессе, магия случается сама собой.',
          '💡 Недооцененный факт: самые крутые идеи приходят не во время мозгового штурма, а в душе, на прогулке или за мытьем посуды. Мозг любит безделье для creativity.',
          '🔥 Парадокс продуктивности: чем больше мы планируем, тем меньше делаем. А чем больше делаем, тем меньше нужно планировать. Действие рождает ясность.'
        ]
      };
      
      setUserStyle(demoStyle);
      setLoading(false);
    }, 1000);
  };

  const loadUserStyle = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading user style for user:', userId);
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key present:', !!supabaseKey);
      
      // Проверяем подключение к Supabase
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Переменные окружения Supabase не настроены. Проверьте файл .env');
      }
      
      // Получаем стиль пользователя
      const { data, error } = await supabase
        .from('user_styles')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Supabase response:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Supabase error:', error);
        throw new Error(`Ошибка базы данных: ${error.message}`);
      }

      if (data) {
        console.log('User style loaded:', data);
        setUserStyle(data);
      } else {
        console.log('No user style found, creating default');
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
    } catch (err: any) {
      console.error('Error loading user style:', err);
      const errorMessage = err.message || 'Неизвестная ошибка при загрузке профиля стиля';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveUserStyle = async (updatedStyle: UserStyle) => {
    if (!user || !updatedStyle) return;

    try {
      setSaving(true);
      setError(null);

      // В демо-режиме или без Telegram просто симулируем сохранение
      if (process.env.REACT_APP_DEMO_MODE === 'true' || !window.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('Demo mode: simulating save', updatedStyle);
        
        // Симулируем время сохранения
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUserStyle(updatedStyle);
        
        const message = !window.Telegram?.WebApp?.initDataUnsafe?.user
          ? '✅ Профиль стиля сохранен (демо-режим)!\n\nДля полной функциональности откройте приложение в Telegram.'
          : '✅ Профиль стиля сохранен (демо-режим)!\n\nДля работы с реальной базой данных настройте Supabase в файле .env';
        
        alert(message);
        
      } else {
        // Реальное сохранение в Supabase
        const { error } = await supabase
          .from('user_styles')
          .upsert(updatedStyle, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          });

        if (error) throw error;

        setUserStyle(updatedStyle);
        alert('Профиль стиля сохранен!');
      }

    } catch (err: any) {
      console.error('Error saving user style:', err);
      const errorMessage = err.message || 'Неизвестная ошибка при сохранении профиля стиля';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleStyleChange = (updatedStyle: UserStyle) => {
    setUserStyle(updatedStyle);
  };

  const handleSave = () => {
    if (userStyle) {
      saveUserStyle(userStyle);
    }
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
        {(!window.Telegram?.WebApp?.initDataUnsafe?.user || process.env.REACT_APP_DEMO_MODE === 'true') && (
          <div className="demo-banner">
            {!window.Telegram?.WebApp?.initDataUnsafe?.user 
              ? '🌐 Демо-режим | Откройте в Telegram для полной функциональности' 
              : '🔬 Демо-режим | Для работы с базой данных настройте Supabase в .env'
            }
          </div>
        )}
        {user && (
          <p className="user-info">
            Привет, {user.firstName}! 
            {window.Telegram?.WebApp?.initDataUnsafe?.user 
              ? ' Настрой свой авторский стиль.' 
              : ' (Демо-версия) Настрой свой авторский стиль.'
            }
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
        
        <div className="save-section">
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App; 