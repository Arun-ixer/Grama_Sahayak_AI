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
                console.warn(`Transient API error (${status || e.message}) generating embedding. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, waitTime));
                delay = waitTime * 2; // exponential backoff
            } else {
                throw e;
            }
        }
    }
}

class EmbeddingService {
    async getEmbedding(text, isQuery = false, customApiKey = null) {
        const provider = (process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();

        if (provider === 'ollama') {
            try {
                const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
                const model = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
                const url = host.replace(/\/$/, '') + '/api/embeddings';
                const payload = {
                    model: model,
                    prompt: text
                };

                const response = await postWithRetry(url, payload, { timeout: 0 }); // No timeout
                if (response.data && response.data.embedding) {
                    return response.data.embedding;
                }
                throw new Error('Invalid embedding response format from local Ollama API');
            } catch (e) {
                console.error('Ollama Embedding Generation Error:', e.message);
                throw new Error(`Ollama embedding request failed: ${e.message}. Ensure Ollama is running and model '${process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'}' is installed.`);
            }
        }

        const apiKey = customApiKey;
        if (!apiKey) {
            throw new Error('Gemini API Key is missing. Please configure it in backend settings.');
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
            const taskType = isQuery ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';
            
            const payload = {
                model: 'models/gemini-embedding-2',
                content: {
                    parts: [{ text: text }]
                },
                taskType: taskType,
                outputDimensionality: 768
            };

            const response = await postWithRetry(url, payload, { timeout: 15000 });
            
            if (response.data && response.data.embedding && response.data.embedding.values) {
                return response.data.embedding.values;
            }
            
            throw new Error('Invalid embedding response format from Google Gemini API');
        } catch (e) {
            console.error('Embedding Generation Error:', e.message);
            throw new Error(`Google API request failed: ${e.message}. If you are behind a corporate proxy, check HTTP_PROXY / HTTPS_PROXY variables.`);
        }
    }

    async getEmbeddingsBatch(texts, customApiKey = null) {
        if (!texts || texts.length === 0) return [];
        const provider = (process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();

        if (provider === 'ollama') {
            try {
                const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
                const model = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
                const allEmbeddings = [];

                for (const text of texts) {
                    const url = host.replace(/\/$/, '') + '/api/embeddings';
                    const payload = {
                        model: model,
                        prompt: text
                    };

                    const response = await postWithRetry(url, payload, { timeout: 0 }); // No timeout
                    if (response.data && response.data.embedding) {
                        allEmbeddings.push(response.data.embedding);
                    } else {
                        throw new Error('Invalid embedding response format from local Ollama API');
                    }
                }
                return allEmbeddings;
            } catch (e) {
                console.error('Ollama Batch Embedding Generation Error:', e.message);
                throw new Error(`Ollama embedding request failed: ${e.message}. Ensure Ollama is running and model '${process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'}' is installed.`);
            }
        }

        const apiKey = customApiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Gemini API Key is missing. Please configure it in backend settings.');
        }

        try {
            const batches = [];
            const batchSize = 15;
            for (let i = 0; i < texts.length; i += batchSize) {
                batches.push(texts.slice(i, i + batchSize));
            }

            const allEmbeddings = [];
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                if (i > 0) {
                    await new Promise(res => setTimeout(res, 2000));
                }

                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${apiKey}`;
                const requests = batch.map(text => ({
                    model: 'models/gemini-embedding-2',
                    content: {
                        parts: [{ text: text }]
                    },
                    taskType: 'RETRIEVAL_DOCUMENT',
                    outputDimensionality: 768
                }));

                const response = await postWithRetry(url, { requests }, { timeout: 30000 });
                if (response.data && response.data.embeddings) {
                    allEmbeddings.push(...response.data.embeddings.map(e => e.values));
                } else {
                    throw new Error('Invalid embedding response format from Google Gemini API');
                }
            }
            return allEmbeddings;
        } catch (e) {
            console.error('Batch Embedding Generation Error:', e.message);
            throw new Error(`Google API request failed: ${e.message}. If you are behind a corporate proxy, check HTTP_PROXY / HTTPS_PROXY variables.`);
        }
    }
}

export const embeddingService = new EmbeddingService();
