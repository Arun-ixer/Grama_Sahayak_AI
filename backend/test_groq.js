import axios from 'axios';

async function testGroq() {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const payload = {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'hello' }],
        temperature: 0.7
    };
    
    // We cannot test the user's specific key because we don't have it.
    // We just want to see if the structure of the request or the model is still valid.
    
    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer INVALID_KEY`,
                'Content-Type': 'application/json'
            }
        });
        console.log(response.data);
    } catch (e) {
        console.error("Error from Groq API:", e.response?.data || e.message);
    }
}

testGroq();
