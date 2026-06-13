import React, { useState } from 'react';
import { api } from '../services/api';

export default function UserProfile({ userProfile, setUserProfile, lang, setLang, provider, setProvider, chatApiKey, setChatApiKey, geminiApiKey, setGeminiApiKey, t }) {
  const [name, setName] = useState(userProfile?.name || '');
  const [state, setState] = useState(userProfile?.state || '');
  const [district, setDistrict] = useState(userProfile?.district || '');
  const [occupation, setOccupation] = useState(userProfile?.occupation || '');
  const [prefLang, setPrefLang] = useState(userProfile?.preferred_language || lang);
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const updated = await api.auth.updateProfile(userProfile.id, {
        name,
        state,
        district,
        occupation,
        preferredLanguage: prefLang
      });
      setUserProfile(updated);
      setLang(prefLang);
      setSuccess(true);
    } catch (err) {
      // console.(err);
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-view-container">
      <h2 className="view-title">⚙️ {t('nav_profile')}</h2>
      <hr className="divider" />

      <form onSubmit={handleSave} className="premium-card form-grid">
        <div className="input-group">
          <label className="input-label">{t('name')}</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="input-field" 
            required 
          />
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">{t('state')}</label>
            <input 
              type="text" 
              value={state} 
              onChange={(e) => setState(e.target.value)} 
              className="input-field" 
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t('district')}</label>
            <input 
              type="text" 
              value={district} 
              onChange={(e) => setDistrict(e.target.value)} 
              className="input-field" 
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">{t('occupation')}</label>
          <input 
            type="text" 
            value={occupation} 
            onChange={(e) => setOccupation(e.target.value)} 
            className="input-field" 
          />
        </div>

        <div className="input-group">
          <label className="input-label">{t('preferred_language')}</label>
          <select 
            value={prefLang} 
            onChange={(e) => setPrefLang(e.target.value)} 
            className="input-field"
          >
            <option value="en">English</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="te">Telugu (తెలుగు)</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">AI Provider</label>
          <select 
            value={provider} 
            onChange={(e) => setProvider(e.target.value)} 
            className="input-field"
          >
            <option value="gemini">Google Gemini</option>
            <option value="grok">xAI Grok</option>
            <option value="ollama">Local Ollama</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Chat API Key (Required)</label>
          <input 
            type="password" 
            value={chatApiKey} 
            onChange={(e) => setChatApiKey(e.target.value)} 
            placeholder={`Paste your ${provider === 'gemini' ? 'Gemini' : provider === 'grok' ? 'Grok' : 'Ollama'} API Key here`}
            className="input-field" 
          />
        </div>

        {provider !== 'gemini' && (
          <div className="input-group" style={{ background: 'rgba(21, 128, 61, 0.05)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--accent-green)' }}>
            <label className="input-label" style={{ color: 'var(--accent-green)' }}>Google Gemini API Key (Required for PDF Uploads)</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', marginTop: '-4px' }}>
              Even though you are using {provider} for chatting, the system strictly relies on Google Gemini's Embedding models to process and read your PDF documents.
            </p>
            <input 
              type="password" 
              value={geminiApiKey} 
              onChange={(e) => setGeminiApiKey(e.target.value)} 
              placeholder="Paste your Gemini API Key here"
              className="input-field" 
            />
          </div>
        )}

        <div className="input-group">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            We do not store your API keys on our servers. They are saved securely in your browser's local storage.
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{t('profile_saved')}</div>}

        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? <div className="spinner"></div> : t('save_profile')}
        </button>
      </form>
    </div>
  );
}
