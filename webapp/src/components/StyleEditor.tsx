import React, { useState } from 'react';
import './StyleEditor.css';

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

interface StyleEditorProps {
  style: UserStyle;
  onChange: (style: UserStyle) => void;
  saving: boolean;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ style, onChange, saving }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'lexicon' | 'writing' | 'examples'>('summary');

  const handleStyleChange = (field: keyof UserStyle, value: any) => {
    const updatedStyle = { ...style, [field]: value };
    onChange(updatedStyle);
  };

  const handleWritingStyleChange = (field: string, value: string) => {
    const updatedWritingStyle = { ...style.writing_style, [field]: value };
    handleStyleChange('writing_style', updatedWritingStyle);
  };

  const handleLexiconChange = (type: 'positive_lexicon' | 'negative_lexicon', value: string) => {
    const words = value.split(',').map(word => word.trim()).filter(word => word.length > 0);
    handleStyleChange(type, words);
  };



  const addExample = () => {
    const newExample = prompt('Введите пример поста:');
    if (newExample && newExample.trim()) {
      const updatedExamples = [...style.examples, newExample.trim()];
      handleStyleChange('examples', updatedExamples);
    }
  };

  const removeExample = (index: number) => {
    const updatedExamples = style.examples.filter((_, i) => i !== index);
    handleStyleChange('examples', updatedExamples);
  };

  return (
    <div className="style-editor">
      {/* Табы */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📝 Описание
        </button>
        <button 
          className={`tab ${activeTab === 'lexicon' ? 'active' : ''}`}
          onClick={() => setActiveTab('lexicon')}
        >
          📖 Словарь
        </button>
        <button 
          className={`tab ${activeTab === 'writing' ? 'active' : ''}`}
          onClick={() => setActiveTab('writing')}
        >
          ⚙️ Настройки
        </button>
        <button 
          className={`tab ${activeTab === 'examples' ? 'active' : ''}`}
          onClick={() => setActiveTab('examples')}
        >
          💡 Примеры
        </button>
      </div>

      {/* Контент табов */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="section">
            <h3>Описание стиля</h3>
            <p className="description">
              Опишите ваш авторский стиль - как вы обычно пишете, какой тон используете.
            </p>
            <textarea
              value={style.style_summary}
              onChange={(e) => handleStyleChange('style_summary', e.target.value)}
              placeholder="Например: Дружелюбный и информативный стиль с юмором..."
              rows={6}
              disabled={saving}
            />
          </div>
        )}

        {activeTab === 'lexicon' && (
          <div className="section">
            <div className="lexicon-section">
              <h3>Предпочитаемые слова</h3>
              <p className="description">
                Слова и выражения, которые вы часто используете и любите.
              </p>
              <textarea
                value={style.positive_lexicon.join(', ')}
                onChange={(e) => handleLexiconChange('positive_lexicon', e.target.value)}
                placeholder="отлично, замечательно, интересно..."
                rows={3}
                disabled={saving}
              />
            </div>

            <div className="lexicon-section">
              <h3>Избегаемые слова</h3>
              <p className="description">
                Слова и выражения, которые вы стараетесь не использовать.
              </p>
              <textarea
                value={style.negative_lexicon.join(', ')}
                onChange={(e) => handleLexiconChange('negative_lexicon', e.target.value)}
                placeholder="шаблонно, банально, скучно..."
                rows={3}
                disabled={saving}
              />
            </div>
          </div>
        )}

        {activeTab === 'writing' && (
          <div className="section">
            <h3>Настройки стиля</h3>
            
            <div className="setting-group">
              <label>Тон:</label>
              <select
                value={style.writing_style.tone}
                onChange={(e) => handleWritingStyleChange('tone', e.target.value)}
                disabled={saving}
              >
                <option value="formal">Формальный</option>
                <option value="neutral">Нейтральный</option>
                <option value="friendly">Дружелюбный</option>
                <option value="casual">Непринужденный</option>
                <option value="humorous">С юмором</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Формальность:</label>
              <select
                value={style.writing_style.formality}
                onChange={(e) => handleWritingStyleChange('formality', e.target.value)}
                disabled={saving}
              >
                <option value="very_formal">Очень формально</option>
                <option value="formal">Формально</option>
                <option value="casual">Неформально</option>
                <option value="very_casual">Очень неформально</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Использование эмодзи:</label>
              <select
                value={style.writing_style.emoji_usage}
                onChange={(e) => handleWritingStyleChange('emoji_usage', e.target.value)}
                disabled={saving}
              >
                <option value="none">Не использовать</option>
                <option value="minimal">Минимально</option>
                <option value="moderate">Умеренно</option>
                <option value="frequent">Часто</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Длина абзацев:</label>
              <select
                value={style.writing_style.paragraph_length}
                onChange={(e) => handleWritingStyleChange('paragraph_length', e.target.value)}
                disabled={saving}
              >
                <option value="short">Короткие</option>
                <option value="medium">Средние</option>
                <option value="long">Длинные</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="section">
            <h3>Примеры постов</h3>
            <p className="description">
              Добавьте примеры ваших постов, чтобы AI лучше понял ваш стиль.
            </p>
            
            {style.examples.map((example, index) => (
              <div key={index} className="example-item">
                <div className="example-content">{example}</div>
                <button 
                  className="remove-example"
                  onClick={() => removeExample(index)}
                  disabled={saving}
                >
                  ❌
                </button>
              </div>
            ))}

            <button 
              className="add-example"
              onClick={addExample}
              disabled={saving}
            >
              ➕ Добавить пример
            </button>

            {style.examples.length === 0 && (
              <div className="no-examples">
                Примеры постов не добавлены. Добавьте несколько примеров для лучшего качества генерации.
              </div>
            )}
          </div>
        )}
      </div>

      {saving && (
        <div className="saving-indicator">
          <div className="spinner small"></div>
          Сохранение...
        </div>
      )}
    </div>
  );
};

export default StyleEditor; 