import React, { useEffect, useState } from 'react';
import { translate } from './services/translate';
import { api } from './services/api';
import ChatAssistant from './components/ChatAssistant';
import FormHelper from './components/FormHelper';
import DocumentDashboard from './components/DocumentDashboard';
import UserProfile from './components/UserProfile';
import { 
  MessageSquare, FileText, FolderClosed, User, LogOut, ArrowLeft, 
  Clock, Globe, CheckSquare, ShieldCheck, Languages, Zap, 
  BrainCircuit, Lock, Tractor, FileCheck, HelpCircle, Search, 
  Users, ArrowRight, Settings, Info, Heart, Database, LayoutDashboard,
  Upload, Sparkles, BookOpen, ChevronRight, CheckCircle2, History
} from 'lucide-react';
import logo from './assets/logo.png';
import bgVideo from './assets/bgv.mp4';
import bgImg from './assets/bg.jpg';

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [lang, setLang] = useState('en');
  const [activeView, setActiveView] = useState('home');

  // LLM settings (under the hood default values)
  const [provider, setProvider] = useState('gemini');
  const [chatApiKey, setChatApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
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

            // Load API keys securely from DB profile
            if (parsed.profile?.provider) setProvider(parsed.profile.provider);
            if (parsed.profile?.chat_api_key) setChatApiKey(parsed.profile.chat_api_key);
            if (parsed.profile?.gemini_api_key) setGeminiApiKey(parsed.profile.gemini_api_key);

            setInitialized(true);
            return;
          }
        } catch (e) {
          // console.('Session parse error:', e);
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

      // Load API keys securely from DB profile
      if (res.profile?.provider) setProvider(res.profile.provider);
      if (res.profile?.chat_api_key) setChatApiKey(res.profile.chat_api_key);
      if (res.profile?.gemini_api_key) setGeminiApiKey(res.profile.gemini_api_key);
      localStorage.setItem('gs_session', JSON.stringify({
        user: res.user,
        profile: res.profile,
        access_token: res.session?.access_token
      }));
      if (activeView === 'login') {
        setActiveView('home');
      }
    } catch (err) {
      // console.(err);
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
      // console.(err);
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
  if (!user && activeView !== 'home') {
    return (
      <div className="auth-outer-container">
        <img src={bgImg} className="bg-video" alt="Background" />
        <div className="auth-card-panel">
          {/* Back to Home Button */}
          <button onClick={() => setActiveView('home')} className="btn-back-home" style={{ marginBottom: '16px' }}>
            <ArrowLeft size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
            <span>{t('back_to_home') || 'Back to Home'}</span>
          </button>
          
          <div className="text-center" style={{ marginTop: '-2.5rem', marginBottom: '-2rem', width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <img src={logo} alt="Gram Sahayak AI Logo" style={{ width: '100%', maxWidth: '400px', height: 'auto', transform: 'scale(1.15)' }} />
          </div>
          <hr className="divider" style={{ marginTop: '0.5rem' }} />

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
                  autoComplete="current-password"
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
                  autoComplete="new-password"
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
      <video className="bg-video" autoPlay loop muted playsInline>
        <source src={bgVideo} type="video/mp4" />
      </video>
      {/* Top Accessible Header */}
      {activeView === 'home' && (
        <header className="app-header">
          <div className="header-logo-section">
            <img src={logo} alt="Gram Sahayak AI Logo" style={{ height: '100px', width: '200px' }} />
          </div>

          <div className="header-actions">
            {/* Quick Language Toggle Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                className={`header-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                English
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

            {user ? (
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <LogOut size={16} />
                <span>{t('logout') || 'Logout'}</span>
              </button>
            ) : (
              <button onClick={() => setActiveView('login')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <User size={16} />
                <span>{t('login') || 'Login'}</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="main-wrapper">
        {activeView === 'home' ? (
          <div className="home-dashboard-view">
            {/* 1. Hero Section */}
            <section className="hero-section">
              <div className="hero-content">
                <h1>{t('hero_title')}</h1>
                <p className="hero-subtitle">{t('hero_subtitle')}</p>
                <p className="hero-description">{t('hero_description')}</p>
                <div className="hero-actions">
                  <button onClick={() => setActiveView('chat')} className="btn btn-primary"><MessageSquare size={20} /> {t('hero_start_chat')}</button>
                  <button onClick={() => setActiveView('dashboard')} className="btn btn-secondary"><Search size={20} /> {t('hero_explore_schemes')}</button>
                  <button onClick={() => setActiveView('dashboard')} className="btn btn-secondary"><Upload size={20} /> {t('hero_upload_docs')}</button>
                </div>
              </div>
              <div className="hero-illustration">
                <img src={logo} alt="Gram Sahayak AI Illustration" />
              </div>
            </section>

            {/* 2. About Section */}
            <section className="about-section glass-container">
              <h2>{t('about_title')}</h2>
              <p>{t('about_desc1')}</p>
              <p>{t('about_desc2')}</p>
              <ul>
                <li><CheckCircle2 size={18} className="text-green" /> {t('about_li_understand')}</li>
                <li><CheckCircle2 size={18} className="text-green" /> {t('about_li_eligibility')}</li>
                <li><CheckCircle2 size={18} className="text-green" /> {t('about_li_certificate')}</li>
                <li><CheckCircle2 size={18} className="text-green" /> {t('about_li_simplify')}</li>
                <li><CheckCircle2 size={18} className="text-green" /> {t('about_li_multilingual')}</li>
                <li><CheckCircle2 size={18} className="text-green" /> {t('about_li_guidance')}</li>
              </ul>
              <p className="mission-text">{t('about_mission')}</p>
            </section>

            {/* 3. Why Choose Us Section */}
            <section className="features-section">
              <h2>{t('features_title')}</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <ShieldCheck size={32} className="feature-icon" />
                  <h4>{t('feature_reliable_title')}</h4>
                  <p>{t('feature_reliable_desc')}</p>
                </div>
                <div className="feature-card">
                  <Languages size={32} className="feature-icon" />
                  <h4>{t('feature_multilingual_title')}</h4>
                  <p>{t('feature_multilingual_desc')}</p>
                </div>
                <div className="feature-card">
                  <Sparkles size={32} className="feature-icon" />
                  <h4>{t('feature_easy_title')}</h4>
                  <p>{t('feature_easy_desc')}</p>
                </div>
                <div className="feature-card">
                  <BrainCircuit size={32} className="feature-icon" />
                  <h4>{t('feature_ai_title')}</h4>
                  <p>{t('feature_ai_desc')}</p>
                </div>
                <div className="feature-card">
                  <Lock size={32} className="feature-icon" />
                  <h4>{t('feature_secure_title')}</h4>
                  <p>{t('feature_secure_desc')}</p>
                </div>
                <div className="feature-card">
                  <Tractor size={32} className="feature-icon" />
                  <h4>{t('feature_rural_title')}</h4>
                  <p>{t('feature_rural_desc')}</p>
                </div>
              </div>
            </section>

            {/* 4. Services Section */}
            <section className="services-section">
              <h2>{t('services_title')}</h2>
              <p className="section-subtitle">{t('services_subtitle')}</p>
              <div className="services-grid">
                <div className="service-card">
                  <BookOpen size={24} className="service-icon" />
                  <h4>{t('service_scheme_title')}</h4>
                  <p>{t('service_scheme_desc')}</p>
                </div>
                <div className="service-card">
                  <FileCheck size={24} className="service-icon" />
                  <h4>{t('service_eligibility_title')}</h4>
                  <p>{t('service_eligibility_desc')}</p>
                </div>
                <div className="service-card">
                  <FileText size={24} className="service-icon" />
                  <h4>{t('service_certificate_title')}</h4>
                  <p>{t('service_certificate_desc')}</p>
                </div>
                <div className="service-card">
                  <Zap size={24} className="service-icon" />
                  <h4>{t('service_document_title')}</h4>
                  <p>{t('service_document_desc')}</p>
                </div>
                <div className="service-card">
                  <ArrowRight size={24} className="service-icon" />
                  <h4>{t('service_application_title')}</h4>
                  <p>{t('service_application_desc')}</p>
                </div>
                <div className="service-card">
                  <Heart size={24} className="service-icon" />
                  <h4>{t('service_welfare_title')}</h4>
                  <p>{t('service_welfare_desc')}</p>
                </div>
                <div className="service-card">
                  <Search size={24} className="service-icon" />
                  <h4>{t('service_search_title')}</h4>
                  <p>{t('service_search_desc')}</p>
                </div>
                <div className="service-card">
                  <Users size={24} className="service-icon" />
                  <h4>{t('service_support_title')}</h4>
                  <p>{t('service_support_desc')}</p>
                </div>
              </div>
            </section>

            {/* 5. How It Works Section */}
            <section className="how-it-works-section">
              <h2>{t('how_title')}</h2>
              <div className="steps-container">
                <div className="step-box">
                  <div className="step-number">1</div>
                  <h4>{t('how_step1_title')}</h4>
                  <p>{t('how_step1_desc')}</p>
                </div>
                <ChevronRight className="step-arrow" size={32} />
                <div className="step-box">
                  <div className="step-number">2</div>
                  <h4>{t('how_step2_title')}</h4>
                  <p>{t('how_step2_desc')}</p>
                </div>
                <ChevronRight className="step-arrow" size={32} />
                <div className="step-box">
                  <div className="step-number">3</div>
                  <h4>{t('how_step3_title')}</h4>
                  <p>{t('how_step3_desc')}</p>
                </div>
                <ChevronRight className="step-arrow" size={32} />
                <div className="step-box">
                  <div className="step-number">4</div>
                  <h4>{t('how_step4_title')}</h4>
                  <p>{t('how_step4_desc')}</p>
                </div>
              </div>
            </section>

            {/* 6. Impact Section */}
            <section className="impact-section glass-container">
              <h2>{t('impact_title')}</h2>
              <p className="impact-desc">{t('impact_desc')}</p>
              <div className="impact-grid">
                <div className="impact-stat">
                  <Languages size={36} />
                  <h5>{t('impact_multilingual')}</h5>
                </div>
                <div className="impact-stat">
                  <Database size={36} />
                  <h5>{t('impact_knowledge')}</h5>
                </div>
                <div className="impact-stat">
                  <Users size={36} />
                  <h5>{t('impact_citizen')}</h5>
                </div>
                <div className="impact-stat">
                  <FileCheck size={36} />
                  <h5>{t('impact_guidance')}</h5>
                </div>
              </div>
            </section>

            {/* 7. Quick Navigation Section */}
            <section className="quick-nav-section">
              <h2>{t('quick_nav_title')}</h2>
              <div className="quick-nav-grid">
                <button onClick={() => setActiveView('home')} className="nav-btn"><LayoutDashboard size={20} /> {t('quick_nav_home')}</button>
                <button onClick={() => setActiveView('chat')} className="nav-btn"><MessageSquare size={20} /> {t('quick_nav_assistant')}</button>
                <button onClick={() => setActiveView('dashboard')} className="nav-btn"><FolderClosed size={20} /> {t('quick_nav_documents')}</button>
                <button onClick={() => setActiveView('dashboard')} className="nav-btn"><BookOpen size={20} /> {t('quick_nav_knowledge')}</button>
                <button onClick={() => setActiveView('profile')} className="nav-btn"><User size={20} /> {t('quick_nav_profile')}</button>
                <button onClick={() => setActiveView('chat')} className="nav-btn"><History size={20} /> {t('quick_nav_history')}</button>
                <button onClick={() => setActiveView('profile')} className="nav-btn"><Settings size={20} /> {t('quick_nav_settings')}</button>
              </div>
            </section>

            {/* 8. Final Call-to-Action Section */}
            <section className="final-cta-section glass-container">
              <h2>{t('cta_title')}</h2>
              <p>{t('cta_desc')}</p>
              <div className="cta-buttons">
                <button onClick={() => setActiveView('chat')} className="btn btn-primary"><MessageSquare size={20} /> {t('cta_start_chat')}</button>
                <button onClick={() => setActiveView('dashboard')} className="btn btn-secondary"><Upload size={20} /> {t('cta_upload_docs')}</button>
              </div>
            </section>

            {/* 9. Footer Section */}
            <footer className="comprehensive-footer glass-container">
              <div className="footer-content">
                <div className="footer-brand">
                  <h3>Gram Sahayak AI</h3>
                  <p>{t('footer_tagline')}</p>
                </div>
                <div className="footer-links-container">
                  <div className="footer-links">
                    <h4>{t('footer_links_title')}</h4>
                    <ul>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('home'); }}>{t('quick_nav_home')}</a></li>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('chat'); }}>{t('quick_nav_assistant')}</a></li>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}>{t('quick_nav_documents')}</a></li>
                      <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('profile'); }}>{t('quick_nav_profile')}</a></li>
                    </ul>
                  </div>
                  <div className="footer-links">
                    <h4>{t('footer_legal_title')}</h4>
                    <ul>
                      <li><a href="#">{t('footer_privacy')}</a></li>
                      <li><a href="#">{t('footer_terms')}</a></li>
                      <li><a href="#">{t('footer_contact')}</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <p className="tagline">{t('footer_motto')}</p>
                <p className="copyright">{t('footer_copyright')}</p>
              </div>
            </footer>
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
                customApiKey={chatApiKey}
                geminiApiKey={geminiApiKey}
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
                customApiKey={chatApiKey}
                geminiApiKey={geminiApiKey}
                ollamaUrl={ollamaUrl}
                ollamaModel={ollamaModel}
                t={t}
              />
            )}

            {activeView === 'dashboard' && (
              <DocumentDashboard
                userProfile={userProfile}
                customApiKey={provider === 'gemini' ? chatApiKey : geminiApiKey}
                t={t}
              />
            )}

            {activeView === 'profile' && (
              <UserProfile
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                lang={lang}
                setLang={setLang}
                provider={provider}
                setProvider={setProvider}
                chatApiKey={chatApiKey}
                setChatApiKey={setChatApiKey}
                geminiApiKey={geminiApiKey}
                setGeminiApiKey={setGeminiApiKey}
                t={t}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
