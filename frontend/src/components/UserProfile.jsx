import React, { useState } from 'react';
import { api } from '../services/api';

export default function UserProfile({ userProfile, setUserProfile, lang, setLang, t }) {
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

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{t('profile_saved')}</div>}

        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? <div className="spinner"></div> : t('save_profile')}
        </button>
      </form>
    </div>
  );
}
