import React, { useEffect, useState } from 'react';
import { translate } from './services/translate';
import { api } from './services/api';
import ChatAssistant from './components/ChatAssistant';
import FormHelper from './components/FormHelper';
import DocumentDashboard from './components/DocumentDashboard';
import UserProfile from './components/UserProfile';
import { MessageSquare, FileText, FolderClosed, User, LogOut, ArrowLeft } from 'lucide-react';

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [lang, setLang] = useState('en');
  const [activeView, setActiveView] = useState('home');

  // LLM settings (under the hood default values)
  const [provider, setProvider] = useState('gemini');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3');

  // Auth Screen State
  const [authTab, setAuthTab] = useState('login'); // login | signup
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupState, setSignupState] = useState('');
  const [signupDistrict, setSignupDistrict] = useState('');
  const [signupOccupation, setSignupOccupation] = useState('');
  const [signupLang, setSignupLang] = useState('en');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // i18n translator wrapper
  const t = (key) => translate(key, lang);

  // Restore session on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedSession = localStorage.getItem('gs_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.user) {
            setUser(parsed.user);
            setUserProfile(parsed.profile);
            setLang(parsed.profile?.preferred_language || 'en');
            setInitialized(true);
            return;
          }
        } catch (e) {
          console.error('Session parse error:', e);
        }
      }

      setInitialized(true);
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(loginEmail, loginPassword);
      setUser(res.user);
      setUserProfile(res.profile);
      setLang(res.profile?.preferred_language || 'en');
      localStorage.setItem('gs_session', JSON.stringify({
        user: res.user,
        profile: res.profile,
        access_token: res.session?.access_token
      }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.auth.signup({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        state: signupState,
        district: signupDistrict,
        occupation: signupOccupation,
        preferredLanguage: signupLang
      });
      setSuccess('Account created successfully! Please log in.');
      setAuthTab('login');
      // Pre-fill email for login
      setLoginEmail(signupEmail);
      // Clear fields
      setSignupEmail('');
      setSignupPassword('');
      setSignupName('');
      setSignupState('');
      setSignupDistrict('');
      setSignupOccupation('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gs_session');
    setUser(null);
    setUserProfile(null);
    setActiveView('home');
    // Clear login credentials input
    setLoginPassword('');
  };

  if (!initialized) {
    return (
      <div className="app-loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // --- Login / Signup View ---
  if (!user) {
    return (
      <div className="auth-outer-container">
        <div className="auth-card-panel">
          <h1 className="title-gradient text-center">🌾 Gram Sahayak AI</h1>
          <p className="auth-subtitle text-center">{t('app_subtitle')}</p>
          <hr className="divider" />

          <div className="auth-tabs-toggle">
            <button 
              onClick={() => { setAuthTab('login'); setError(null); setSuccess(null); }}
              className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
            >
              {t('login')}
            </button>
            <button 
              onClick={() => { setAuthTab('signup'); setError(null); setSuccess(null); }}
              className={`auth-tab-btn ${authTab === 'signup' ? 'active' : ''}`}
            >
              {t('signup')}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="flex-column-gap">
              <div className="input-group">
                <label className="input-label">{t('email')}</label>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">{t('password')}</label>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? <div className="spinner spinner-small"></div> : t('login')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex-column-gap">
              <div className="input-group">
                <label className="input-label">{t('name')} *</label>
                <input 
                  type="text" 
                  value={signupName} 
                  onChange={(e) => setSignupName(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">{t('email')} *</label>
                <input 
                  type="email" 
                  value={signupEmail} 
                  onChange={(e) => setSignupEmail(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">{t('password')} *</label>
                <input 
                  type="password" 
                  value={signupPassword} 
                  onChange={(e) => setSignupPassword(e.target.value)} 
                  className="input-field" 
                  required 
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">{t('state')}</label>
                  <input 
                    type="text" 
                    value={signupState} 
                    onChange={(e) => setSignupState(e.target.value)} 
                    className="input-field" 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">{t('district')}</label>
                  <input 
                    type="text" 
                    value={signupDistrict} 
                    onChange={(e) => setSignupDistrict(e.target.value)} 
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">{t('occupation')}</label>
                <input 
                  type="text" 
                  value={signupOccupation} 
                  onChange={(e) => setSignupOccupation(e.target.value)} 
                  className="input-field" 
                />
              </div>

              <div className="input-group">
                <label className="input-label">{t('preferred_language')}</label>
                <select 
                  value={signupLang} 
                  onChange={(e) => setSignupLang(e.target.value)} 
                  className="input-field"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? <div className="spinner spinner-small"></div> : t('signup')}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- Logged in Main Panel View ---
  return (
    <div className="app-main-layout">
      {/* Top Accessible Header */}
      <header className="app-header">
        <div className="header-logo-section">
          <span className="header-logo">🌾</span>
          <div className="header-title-block">
            <h1 className="title-gradient">Gram Sahayak AI</h1>
            <p>{t('app_subtitle')}</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Quick Language Toggle Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`header-lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              🇺🇸 English
            </button>
            <button 
              className={`header-lang-btn ${lang === 'hi' ? 'active' : ''}`}
              onClick={() => setLang('hi')}
            >
              हिन्दी
            </button>
            <button 
              className={`header-lang-btn ${lang === 'te' ? 'active' : ''}`}
              onClick={() => setLang('te')}
            >
              తెలుగు
            </button>
          </div>

          {userProfile && (
            <div className="user-badge-header">
              <div className="user-badge-avatar">
                {userProfile.name?.charAt(0).toUpperCase()}
              </div>
              <span>{userProfile.name}</span>
            </div>
          )}

          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {activeView === 'home' ? (
          <div className="home-dashboard-view">
            {/* Welcoming Section */}
            <div className="welcome-hero">
              <h2>🌾 {t('home_welcome_title')}</h2>
              <p>{t('home_welcome_subtitle')}</p>
            </div>

            {/* Core Action Grid */}
            <div className="home-grid">
              {/* Card 1: Chat Assistant */}
              <div onClick={() => setActiveView('chat')} className="nav-card">
                <div className="nav-card-icon">
                  <MessageSquare size={32} />
                </div>
                <div className="nav-card-details">
                  <h3>💬 {t('nav_chat')}</h3>
                  <p>{t('ask_ai_desc')}</p>
                </div>
              </div>

              {/* Card 2: Form Helper */}
              <div onClick={() => setActiveView('form_helper')} className="nav-card">
                <div className="nav-card-icon">
                  <FileText size={32} />
                </div>
                <div className="nav-card-details">
                  <h3>📝 {t('nav_form')}</h3>
                  <p>{t('fill_form_desc')}</p>
                </div>
              </div>

              {/* Card 3: Document Dashboard */}
              <div onClick={() => setActiveView('dashboard')} className="nav-card">
                <div className="nav-card-icon">
                  <FolderClosed size={32} />
                </div>
                <div className="nav-card-details">
                  <h3>📚 {t('nav_dashboard')}</h3>
                  <p>{t('scheme_desc')}</p>
                </div>
              </div>

              {/* Card 4: User Profile */}
              <div onClick={() => setActiveView('profile')} className="nav-card">
                <div className="nav-card-icon">
                  <User size={32} />
                </div>
                <div className="nav-card-details">
                  <h3>⚙️ {t('nav_profile')}</h3>
                  <p>{t('profile_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Prominent Back to Menu Button */}
            <button onClick={() => setActiveView('home')} className="btn-back-home">
              <ArrowLeft size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
              <span>{t('back_to_home')}</span>
            </button>

            {/* Active view renderer */}
            {activeView === 'chat' && (
              <ChatAssistant 
                userProfile={userProfile}
                lang={lang}
                provider={provider}
                ollamaUrl={ollamaUrl}
                ollamaModel={ollamaModel}
                t={t}
              />
            )}

            {activeView === 'form_helper' && (
              <FormHelper 
                userProfile={userProfile}
                lang={lang}
                provider={provider}
                ollamaUrl={ollamaUrl}
                ollamaModel={ollamaModel}
                t={t}
              />
            )}

            {activeView === 'dashboard' && (
              <DocumentDashboard 
                userProfile={userProfile}
                t={t}
              />
            )}

            {activeView === 'profile' && (
              <UserProfile 
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                lang={lang}
                setLang={setLang}
                t={t}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
