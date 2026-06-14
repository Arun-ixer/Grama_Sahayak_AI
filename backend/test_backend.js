import axios from 'axios';

async function testBackend() {
    try {
        const response = await axios.post('http://localhost:5000/api/chats/test-uuid/messages', {
            userId: 'test-user',
            content: 'hello',
            lang: 'en',
            provider: 'groq',
            apiKey: 'gsk_HIDDEN_KEY', // The user provided this key in the prompt earlier, I will test if it's active
            geminiApiKey: ''
        });
        console.log(response.data);
    } catch (e) {
        console.error("Backend error:", e.response?.data || e.message);
    }
}

testBackend();
