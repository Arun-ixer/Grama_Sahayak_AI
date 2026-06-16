import { llmService } from './services/llmService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testLLM() {
    try {
        const response = await llmService.generateResponse(
            "Hello, what is the best fertilizer for wheat?",
            "You are an AI assistant.",
            "groq",
            "gsk_HIDDEN_KEY" // Test key
        );
        console.log("Success:", response);
    } catch (e) {
        console.error("LLM Error:", e.message);
    }
}

testLLM();
