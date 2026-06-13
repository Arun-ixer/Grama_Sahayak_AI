import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, Plus, Download, Mic, Pencil, Trash2, Check, X, Volume2, VolumeX } from 'lucide-react';
import { api } from '../services/api';

const renderMessageContent = (content) => {
  if (!content) return '';
  
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    // Check for source citations: e.g. "- [RGK.pdf](https://...)" or "- [Title](url)"
    const bulletMatch = line.match(/^[-*]\s+\[(.*?)\]\((.*?)\)/);
    if (bulletMatch) {
      const [, label, url] = bulletMatch;
      return (
        <div key={idx} className="citation-link-line" style={{ margin: '6px 0', paddingLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--accent-green)' }}>•</span>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="doc-citation-badge" 
            style={{ 
              color: 'var(--accent-green)', 
              fontWeight: '700', 
              textDecoration: 'underline',
              backgroundColor: 'rgba(21, 128, 61, 0.05)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}
          >
            {label}
          </a>
        </div>
      );
    }

    // Bold formatting parser: replaces **text**
    const parts = [];
    let currentLine = line;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = boldRegex.exec(currentLine)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(currentLine.substring(lastIndex, matchIndex));
      }
      parts.push(<strong key={matchIndex} style={{ fontWeight: '700' }}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < currentLine.length) {
      parts.push(currentLine.substring(lastIndex));
    }

    // Check if the line is just bold header "**Sources used:**"
    if (line.trim().startsWith('**Sources used:**')) {
      return (
        <div key={idx} style={{ fontWeight: '700', marginTop: '12px', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
          📚 Sources used:
        </div>
      );
    }

    return (
      <p key={idx} className="bubble-text-line" style={{ margin: '4px 0', minHeight: '1.2em', wordBreak: 'break-word' }}>
        {parts.length > 0 ? parts : line}
      </p>
    );
  });
};

export default function ChatAssistant({ userProfile, lang, provider, ollamaUrl, ollamaModel, t }) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messages, setMessages] = useState([]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  
  // TTS State
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const handleRenameChat = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = async (chatId) => {
    if (!editTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      await api.chats.renameChat(chatId, userProfile.id, editTitle.trim());
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editTitle.trim() } : c));
    } catch (e) {
      console.error('Failed to rename chat:', e);
      alert('Failed to rename chat.');
    } finally {
      setEditingChatId(null);
    }
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
  };

  const handleRenameKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      handleSaveRename(chatId);
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const handleDeleteChat = async (chatId) => {
    const confirmationMsg = lang === 'hi' 
      ? 'क्या आप इस चैट को हटाना चाहते हैं?' 
      : lang === 'te' 
        ? 'మీరు ఈ చాట్‌ను తొలగించాలనుకుంటున్నారా?' 
        : 'Are you sure you want to delete this chat?';
        
    if (!window.confirm(confirmationMsg)) return;
    try {
      await api.chats.deleteChat(chatId, userProfile.id);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId('');
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to delete chat:', e);
      alert('Failed to delete chat.');
    }
  };

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
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
        setInputText(prev => prev ? prev + ' ' + transcript : transcript);
      };
      
      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
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
      // Choose locale dynamic language code
      const speechLang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-IN';
      recognitionRef.current.lang = speechLang;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition start failed:', err);
      }
    }
  };

  const fetchChats = async () => {
    try {
      const list = await api.chats.getChats(userProfile.id);
      setChats(list);
    } catch (e) {
      console.error('Failed to get chats:', e);
    }
  };

  const loadMessages = async (chatId) => {
    if (!chatId) return;
    try {
      const msgs = await api.chats.getMessages(chatId);
      setMessages(msgs);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  useEffect(() => {
    if (userProfile?.id) {
      fetchChats();
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submitQuestion = async (text) => {
    if (!text.trim()) return;

    let chatId = activeChatId;
    setLoading(true);

    try {
      // 1. Create a chat session if none is active
      if (!chatId) {
        const title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        const newChat = await api.chats.createChat(userProfile.id, title);
        chatId = newChat.id;
        setActiveChatId(chatId);
        // Refresh chat logs list
        await fetchChats();
      }

      const tempUserMsg = {
        role: 'user',
        content: text,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempUserMsg]);
      setInputText('');

      // 2. Query RAG backend
      await api.chats.sendMessage(
        chatId,
        userProfile.id,
        tempUserMsg.content,
        lang,
        provider,
        null, // Use global API key from backend
        ollamaUrl,
        ollamaModel
      );

      // Reload entire message history to ensure Supabase timestamps align
      loadMessages(chatId);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Failed to get response: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Text-to-Speech (TTS) Logic ---
  const toggleSpeech = (msgId, content) => {
    if (speakingMsgId === msgId) {
      // If already speaking this message, stop it
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Auto-detect the language of the text based on Unicode characters
    let detectedBaseLang = lang.split('-')[0];
    if (/[\u0C00-\u0C7F]/.test(content)) {
      detectedBaseLang = 'te'; // Contains Telugu characters
    } else if (/[\u0900-\u097F]/.test(content)) {
      detectedBaseLang = 'hi'; // Contains Hindi/Devanagari characters
    }

    const langMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    const bcpLang = langMap[detectedBaseLang] || 'en-IN';

    // Strip markdown formatting like asterisks, links, etc. for better reading
    // Also remove citations entirely so it doesn't read "Sources used: RGK.pdf"
    let cleanText = content
      .replace(/[*_~`#]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/Sources used:[\s\S]*/gi, '') // Remove sources block
      .replace(/📚/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = bcpLang;

    // Optional: try to find a voice that specifically matches the lang
    const voices = window.speechSynthesis.getVoices();
    
    // Better heuristic for finding Indian voices
    const targetVoice = voices.find(v => {
      const vLang = v.lang.replace('_', '-').toLowerCase();
      const vName = v.name.toLowerCase();
      
      if (vLang === bcpLang.toLowerCase()) return true;
      if (vLang.startsWith(detectedBaseLang)) return true;
      if (detectedBaseLang === 'hi' && vName.includes('hindi')) return true;
      if (detectedBaseLang === 'te' && vName.includes('telugu')) return true;
      
      return false;
    });

    if (targetVoice) {
      utterance.voice = targetVoice;
    } else {
      if (detectedBaseLang !== 'en') {
        alert(`Your browser/device does not have a ${detectedBaseLang === 'te' ? 'Telugu' : 'Hindi'} voice installed. Please use Google Chrome or install the language pack in Windows Settings.`);
      }
      console.warn(`No native voice found for ${bcpLang}. Using default.`);
    }

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Clean up speech on component unmount and preload voices
  useEffect(() => {
    if (window.speechSynthesis) {
      // Trigger voice load
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    submitQuestion(inputText);
  };

  const handleChipClick = (questionKey) => {
    submitQuestion(t(questionKey));
  };

  const handleNewChat = () => {
    setActiveChatId('');
    setMessages([]);
  };

  const activeChatTitle = chats.find(c => c.id === activeChatId)?.title || 'Chat Session';

  return (
    <div className="chat-view-container">
      <h2 className="view-title">💬 {t('nav_chat')}</h2>
      <hr className="divider" />

      <div className="chat-interface-layout">
        {/* Left Side: Sessions Sidebar */}
        <div className="chat-history-sidebar">
          <button onClick={handleNewChat} className="btn btn-secondary btn-block" style={{ padding: '12px', fontWeight: '700' }}>
            <Plus size={16} style={{ marginRight: '4px' }} />
            <span>{t('new_chat')}</span>
          </button>
          
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '10px' }}>
            {t('chat_history')}
          </div>
          
          <div className="chat-history-scroller">
            {chats.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '10px 0' }}>
                No chats yet
              </div>
            ) : (
              chats.map(c => (
                <div 
                  key={c.id} 
                  className={`chat-history-item-wrapper ${activeChatId === c.id ? 'active' : ''}`}
                >
                  {editingChatId === c.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '2px 4px' }}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveRename(c.id)}
                        onKeyDown={(e) => handleRenameKeyDown(e, c.id)}
                        className="chat-history-rename-input"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); handleSaveRename(c.id); }}
                        className="chat-action-btn check" 
                        title={t('rename')}
                        style={{ color: 'var(--accent-green)' }}
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); handleCancelRename(); }}
                        className="chat-action-btn cancel" 
                        title="Cancel"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => setActiveChatId(c.id)}
                        className="chat-history-item-btn"
                        title={c.title}
                      >
                        {c.title}
                      </button>
                      <div className="chat-history-actions">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRenameChat(c.id, c.title); }} 
                          className="chat-action-btn edit" 
                          title={t('rename')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteChat(c.id); }} 
                          className="chat-action-btn delete" 
                          title={t('delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Main Chat Box */}
        <div className="chat-box-card">
          <div className="messages-scroller">
            {messages.length === 0 ? (
              <div className="empty-chat-state" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <MessageSquare size={44} style={{ color: 'var(--accent-green)', marginBottom: '8px' }} />
                  <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>🌾 {t('welcome')}!</p>
                  <span className="subtext" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {t('home_welcome_subtitle')}
                  </span>
                </div>
                
                <div className="quick-suggestions-box" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                  <h4 className="quick-suggestions-title">
                    {t('quick_guides')}
                  </h4>
                  <div className="quick-suggestions-grid">
                    <button onClick={() => handleChipClick('quick_q_ration')} className="quick-suggestion-chip">
                      <span>🌾</span>
                      <span>{t('quick_q_ration')}</span>
                    </button>
                    <button onClick={() => handleChipClick('quick_q_kisan')} className="quick-suggestion-chip">
                      <span>🚜</span>
                      <span>{t('quick_q_kisan')}</span>
                    </button>
                    <button onClick={() => handleChipClick('quick_q_caste')} className="quick-suggestion-chip">
                      <span>📄</span>
                      <span>{t('quick_q_caste')}</span>
                    </button>
                    <button onClick={() => handleChipClick('quick_q_subsidy')} className="quick-suggestion-chip">
                      <span>🌱</span>
                      <span>{t('quick_q_subsidy')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={msg.id || i} className={`chat-msg-row ${msg.role}`}>
                  <div className={`chat-msg-avatar ${msg.role}`}>
                    {msg.role === 'user' ? (userProfile?.name?.charAt(0).toUpperCase() || 'U') : '🌾'}
                  </div>
                  <div className="chat-msg-content">
                    <div>{renderMessageContent(msg.content)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span className="bubble-time">
                        {msg.created_at ? msg.created_at.substring(0, 16).replace('T', ' ') : ''}
                      </span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => toggleSpeech(msg.id || i, msg.content)}
                          className="tts-btn"
                          title={speakingMsgId === (msg.id || i) ? "Stop Reading" : "Read Aloud"}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: speakingMsgId === (msg.id || i) ? 'var(--accent-green)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {speakingMsgId === (msg.id || i) ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="chat-input-container">
            <form onSubmit={handleSendMessage} className="chat-input-pill-box">
              {speechSupported && (
                <button 
                  type="button" 
                  onClick={toggleListening} 
                  className={`btn-mic-icon ${isListening ? 'listening' : ''}`}
                  style={{ width: '38px', height: '38px', border: 'none' }}
                  title={isListening ? t('listening') : t('tap_to_speak')}
                >
                  <Mic size={18} />
                </button>
              )}

              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('chat_input_placeholder')}
                className="chat-text-input"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !inputText.trim()} className="chat-send-btn">
                {loading ? <div className="spinner spinner-small"></div> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {isListening && (
        <div className="listening-indicator" style={{ padding: '0 8px', marginTop: '6px' }}>
          <div className="listening-pulse-dot"></div>
          <span>{t('listening')}</span>
        </div>
      )}

      {/* Download PDF button */}
      {activeChatId && messages.length > 0 && (
        <div className="margin-top-16" style={{ marginTop: '16px' }}>
          <a 
            href={api.chats.getDownloadUrl(activeChatId, activeChatTitle)}
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary btn-block text-center-anchor"
            style={{ textDecoration: 'none' }}
          >
            <Download size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            <span>{t('download_pdf')}</span>
          </a>
        </div>
      )}
    </div>
  );
}
