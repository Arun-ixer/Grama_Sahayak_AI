import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ override: true });

// Helper for transient API error retries (exponential backoff)
async function postWithRetry(url, payload, options = {}, retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.post(url, payload, options);
        } catch (e) {
            const status = e.response?.status;
            const errorMsg = e.response?.data?.error?.message || '';
            const isQuotaExceeded = status === 429 && errorMsg.includes('Quota exceeded');
            const isTransient = !isQuotaExceeded && (!status || status === 429 || (status >= 500 && status <= 504));

            if (isTransient && i < retries - 1) {
                const waitTime = status === 429 ? Math.max(delay, 5000) : delay;
                console.warn(`Transient API error (${status || e.message}) generating text response. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, waitTime));
                delay = waitTime * 2; // exponential backoff
            } else {
                throw e;
            }
        }
    }
}

class LLMService {
    async generateResponse(prompt, systemInstruction = null, provider = 'gemini', customApiKey = null, ollamaUrl = null, ollamaModel = 'llama3') {
        let prov = provider.toLowerCase();
        if (prov === 'grok') prov = 'groq'; // Backward compatibility for stale localStorage

        switch (prov) {
            case 'gemini':
                return await this._generateGemini(prompt, systemInstruction, customApiKey);
            case 'groq':
                return await this._generateGroq(prompt, systemInstruction, customApiKey);
            case 'ollama':
                return await this._generateOllama(prompt, systemInstruction, ollamaUrl, ollamaModel);
            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    }

    async _generateGemini(prompt, systemInstruction, customApiKey) {
        const apiKey = customApiKey;
        if (!apiKey) {
            throw new Error('Gemini API Key is missing. Please configure it in backend settings.');
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
                }]
            };

            if (systemInstruction) {
                payload.systemInstruction = {
                    parts: [{ text: systemInstruction }]
                };
            }

            const response = await postWithRetry(url, payload, { timeout: 30000 });

            if (
                response.data &&
                response.data.candidates &&
                response.data.candidates[0] &&
                response.data.candidates[0].content &&
                response.data.candidates[0].content.parts &&
                response.data.candidates[0].content.parts[0]
            ) {
                return response.data.candidates[0].content.parts[0].text;
            }

            throw new Error('Invalid generation response structure from Google API');
        } catch (e) {
            console.error('Gemini Generation Error:', e.message);
            throw new Error(`Google API request failed: ${e.message}. If you are behind a corporate proxy, check HTTP_PROXY / HTTPS_PROXY variables.`);
        }
    }

    async _generateGroq(prompt, systemInstruction, customApiKey) {
        const apiKey = customApiKey;
        if (!apiKey) {
            throw new Error('Groq API Key is missing.');
        }

        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const payload = {
            messages,
            model: 'llama-3.1-8b-instant',
            stream: false
        };

        try {
            const response = await postWithRetry(url, payload, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                return response.data.choices[0].message.content;
            }
            throw new Error('Invalid generation response structure from Groq API');
        } catch (e) {
            console.error('Groq Generation Error Full response:', e.response?.data || e.message);
            const errData = e.response?.data?.error;
            const errMsg = errData?.message || (typeof errData === 'string' ? errData : e.message);
            throw new Error(`Groq API request failed: ${errMsg}`);
        }
    }

    async _generateOllama(prompt, systemInstruction, ollamaUrl, ollamaModel) {
        const host = ollamaUrl || process.env.OLLAMA_HOST || 'http://localhost:11434';
        const endpoint = host.replace(/\/$/, '') + '/api/generate';

        let fullPrompt = prompt;
        if (systemInstruction) {
            fullPrompt = `System Instruction: ${systemInstruction}\n\nUser Query: ${prompt}`;
        }

        const payload = {
            model: ollamaModel,
            prompt: fullPrompt,
            stream: false
        };

        try {
            const response = await postWithRetry(endpoint, payload, { timeout: 0 }); // No timeout for slow local CPU inference
            if (response.data && response.data.response) {
                return response.data.response;
            }
            throw new Error('Ollama returned empty response');
        } catch (e) {
            console.error('Ollama Generation Error:', e.message);
            throw new Error(`Ollama request failed: ${e.message}. Ensure Ollama is running locally and model '${ollamaModel}' is installed.`);
        }
    }

    async getOllamaModels(ollamaUrl = null) {
        const host = ollamaUrl || process.env.OLLAMA_HOST || 'http://localhost:11434';
        const endpoint = host.replace(/\/$/, '') + '/api/tags';
        try {
            const response = await axios.get(endpoint, { timeout: 5000 });
            if (response.status === 200 && response.data && response.data.models) {
                return response.data.models.map(m => m.name);
            }
            return ['llama3', 'mistral', 'gemma'];
        } catch (e) {
            console.warn('Ollama tags unreachable, falling back to defaults:', e.message);
            return ['llama3', 'mistral', 'gemma'];
        }
    }
}

export const llmService = new LLMService();
