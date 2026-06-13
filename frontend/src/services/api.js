import axios from 'axios';

// Use live URL from Vercel settings, or fallback to localhost for local testing
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Configure token injection if needed (Supabase Session Token can be saved in local storage)
client.interceptors.request.use((config) => {
    const session = localStorage.getItem('gs_session');
    if (session) {
        try {
            const parsed = JSON.parse(session);
            if (parsed && parsed.access_token) {
                config.headers.Authorization = `Bearer ${parsed.access_token}`;
            }
        } catch (e) {
            console.error('Session token parse error:', e);
        }
    }
    return config;
});

export const api = {
    // --- Auth Endpoints ---
    auth: {
        signup: async (data) => (await client.post('/auth/signup', data)).data,
        login: async (email, password) => (await client.post('/auth/login', { email, password })).data,
        autologin: async () => (await client.post('/auth/autologin')).data,
        getProfile: async (userId) => (await client.get(`/auth/profile/${userId}`)).data,
        updateProfile: async (userId, data) => (await client.post(`/auth/profile/${userId}`, data)).data
    },

    // --- Document Endpoints ---
    documents: {
        upload: async (userId, file, apiKey = null) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);
            if (apiKey) formData.append('apiKey', apiKey);

            return (await client.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })).data;
        },
        getDocuments: async (userId) => (await client.get(`/documents/user/${userId}`)).data,
        deleteDocument: async (docId, userId) => (await client.delete(`/documents/${docId}/user/${userId}`)).data
    },

    // --- Chat Endpoints ---
    chats: {
        createChat: async (userId, title) => (await client.post('/chats', { userId, title })).data,
        getChats: async (userId) => (await client.get(`/chats/user/${userId}`)).data,
        deleteChat: async (chatId, userId) => (await client.delete(`/chats/${chatId}/user/${userId}`)).data,
        renameChat: async (chatId, userId, title) => (await client.put(`/chats/${chatId}/user/${userId}`, { title })).data,
        getMessages: async (chatId) => (await client.get(`/chats/${chatId}/messages`)).data,
        sendMessage: async (chatId, userId, content, lang, provider, apiKey, ollamaUrl, ollamaModel) => {
            return (await client.post(`/chats/${chatId}/messages`, {
                userId,
                content,
                lang,
                provider,
                apiKey,
                ollamaUrl,
                ollamaModel
            })).data;
        },
        getDownloadUrl: (chatId, title) => {
            return `${API_BASE_URL}/chats/${chatId}/download?title=${encodeURIComponent(title || '')}`;
        }
    },

    // --- Form Endpoints ---
    forms: {
        getForms: async (lang = 'en') => (await client.get(`/forms?lang=${lang}`)).data,
        getFormDetails: async (formId) => (await client.get(`/forms/${formId}`)).data,
        prefill: async (formId, profile) => (await client.post('/forms/prefill', { formId, profile })).data,
        extract: async ({ formId, currentValues, userMessage, lang, apiKey, provider, ollamaUrl, ollamaModel }) => {
            return (await client.post('/forms/extract', {
                formId,
                currentValues,
                userMessage,
                lang,
                apiKey,
                provider,
                ollamaUrl,
                ollamaModel
            })).data;
        },
        generateDraft: async ({ formId, values, lang, apiKey, provider, ollamaUrl, ollamaModel }) => {
            return (await client.post('/forms/draft', {
                formId,
                values,
                lang,
                apiKey,
                provider,
                ollamaUrl,
                ollamaModel
            })).data;
        }
    }
};
