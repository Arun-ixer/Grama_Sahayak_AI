import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, FileText, Download, UserCheck, Mic } from 'lucide-react';
import { api } from '../services/api';

export default function FormHelper({ userProfile, lang, provider, customApiKey, geminiApiKey, ollamaUrl, ollamaModel, t }) {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formDetails, setFormDetails] = useState(null);
  const [formValues, setFormValues] = useState({});
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFilling, setAiFilling] = useState(false);
  
  const [draftText, setDraftText] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState(null);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAiPrompt(prev => prev ? prev + ' ' + transcript : transcript);
      };
      
      rec.onerror = (e) => {
        // console.('Speech recognition error:', e);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      const speechLang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-IN';
      recognitionRef.current.lang = speechLang;
      try {
        recognitionRef.current.start();
      } catch (err) {
        // console.('Speech recognition start failed:', err);
      }
    }
  };

  // Fetch available forms on mount or language change
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const list = await api.forms.getForms(lang);
        setForms(list);
        if (list.length > 0 && !selectedFormId) {
          setSelectedFormId(list[0].id);
        }
      } catch (e) {
        // console.('Failed to get form list:', e);
      }
    };
    fetchForms();
  }, [lang]);

  // Fetch form details and prefill when selectedFormId changes
  useEffect(() => {
    if (!selectedFormId) return;

    const fetchDetails = async () => {
      try {
        const details = await api.forms.getFormDetails(selectedFormId);
        setFormDetails(details);
        
        // Prefill values based on user profile
        const initialValues = await api.forms.prefill(selectedFormId, userProfile || {});
        setFormValues(initialValues);
        setDraftText('');
      } catch (e) {
        // console.('Failed to load form metadata details:', e);
      }
    };
    fetchDetails();
  }, [selectedFormId, userProfile]);

  const handleFieldChange = (fieldId, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleAiFill = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiFilling(true);
    setError(null);
    try {
      const updatedValues = await api.forms.extract({
        formId: selectedFormId,
        currentValues: formValues,
        userMessage: aiPrompt,
        lang,
        apiKey: customApiKey,
        geminiApiKey,
        provider,
        ollamaUrl,
        ollamaModel
      });
      setFormValues(updatedValues);
      setAiPrompt('');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      setError(`Failed to extract slot details: ${errMsg}. Make sure your API keys are valid.`);
    } finally {
      setAiFilling(false);
    }
  };

  const handleGenerateDraft = async () => {
    setDrafting(true);
    setError(null);
    try {
      const res = await api.forms.generateDraft({
        formId: selectedFormId,
        values: formValues,
        lang,
        apiKey: customApiKey,
        geminiApiKey,
        provider,
        ollamaUrl,
        ollamaModel
      });
      setDraftText(res.draft);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      setError(`Failed to generate draft: ${errMsg}. Make sure your API keys are valid.`);
    } finally {
      setDrafting(false);
    }
  };

  const downloadDraftFile = () => {
    if (!draftText) return;
    const blob = new Blob([draftText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gram_sahayak_draft_${selectedFormId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (forms.length === 0 || !formDetails) {
    return <div className="loading-state"><div className="spinner"></div></div>;
  }

  // Calculate Progress
  const totalFields = formDetails.fields.length || 0;
  const filledFieldsCount = formDetails.fields.reduce((acc, field) => {
    return formValues[field.id] ? acc + 1 : acc;
  }, 0);
  const progressPercent = totalFields > 0 ? Math.round((filledFieldsCount / totalFields) * 100) : 0;

  return (
    <div className="form-helper-view-container">
      <h2 className="view-title">📝 {t('form_helper_title')}</h2>
      <hr className="divider" />

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Select Form */}
      <div className="premium-card">
        <label className="input-label">{t('select_form')}</label>
        <select 
          value={selectedFormId} 
          onChange={(e) => setSelectedFormId(e.target.value)}
          className="input-field select-full"
        >
          {forms.map(f => (
            <option key={f.id} value={f.id}>{f.title}</option>
          ))}
        </select>
        <p className="form-description-text" style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
          {formDetails.description[lang] || formDetails.description.en}
        </p>
      </div>

      {/* Form Progress bar */}
      <div className="form-progress-section">
        <div className="form-progress-text">
          <span>{t('form_helper_title')} Completion Progress</span>
          <span>{filledFieldsCount} / {totalFields} fields filled ({progressPercent}%)</span>
        </div>
        <div className="form-progress-bar-container">
          <div 
            className="form-progress-bar-fill" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="grid-2">
        {/* Form Input fields */}
        <div className="premium-card">
          <div className="prefill-notification" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-green)', fontWeight: '700' }}>
            <UserCheck size={18} />
            <span>{t('profile_prefilled')}</span>
          </div>

          <div className="form-fields-grid">
            {formDetails.fields.map(field => {
              const label = field.label[lang] || field.label.en;
              return (
                <div key={field.id} className="input-group">
                  <label className="input-label">{label}</label>
                  <input 
                    type="text" 
                    value={formValues[field.id] || ''} 
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="input-field" 
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Form Fill Assistant */}
        <div className="flex-column-gap" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="premium-card">
            <h3 className="card-title">🤖 {t('form_helper_title')} (AI Voice / Text)</h3>
            <p className="card-subtitle" style={{ marginBottom: '16px' }}>
              Instead of typing, click the microphone icon below to describe your situation, and let the AI fill the fields.
            </p>

            <form onSubmit={handleAiFill} className="flex-column-gap-10" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: 'My name is Ramesh. I live in Telangana, Warangal. My occupation is farming.'"
                  className="input-field text-area-medium"
                  rows={4}
                  style={{ paddingRight: '50px' }}
                  required
                />
                {speechSupported && (
                  <button 
                    type="button" 
                    onClick={toggleListening} 
                    className={`btn-mic-icon ${isListening ? 'listening' : ''}`}
                    style={{ position: 'absolute', right: '12px', bottom: '12px', zIndex: 10 }}
                    title={isListening ? t('listening') : t('tap_to_speak')}
                  >
                    <Mic size={18} />
                  </button>
                )}
              </div>

              {isListening && (
                <div className="listening-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="listening-pulse-dot"></div>
                  <span>{t('listening')}</span>
                </div>
              )}

              <button type="submit" disabled={aiFilling} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                {aiFilling ? <div className="spinner"></div> : (
                  <>
                    <Sparkles size={16} />
                    <span>Run AI Form Fill</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <button 
            onClick={handleGenerateDraft} 
            disabled={drafting} 
            className="btn btn-primary btn-block"
          >
            {drafting ? <div className="spinner"></div> : (
              <>
                <FileText size={18} />
                <span>{t('generate_draft')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Output Draft Section */}
      {draftText && (
        <div className="premium-card margin-top-24" style={{ marginTop: '24px' }}>
          <h3 className="card-title">{t('draft_ready')}</h3>
          <textarea 
            value={draftText} 
            readOnly 
            className="input-field text-area-large"
            rows={12}
          />
          <button onClick={downloadDraftFile} className="btn btn-primary btn-block margin-top-12" style={{ marginTop: '12px' }}>
            <Download size={18} />
            <span>{t('download_draft')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
