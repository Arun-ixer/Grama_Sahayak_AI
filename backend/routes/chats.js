import express from 'express';
import { supabaseService } from '../services/supabaseService.js';
import { ragService } from '../services/ragService.js';
import { pdfService } from '../services/pdfService.js';

const router = express.Router();

// 1. Create a Chat Session
router.post('/', async (req, res) => {
    const { userId, title } = req.body;
    if (!userId || !title) {
        return res.status(400).json({ error: 'User ID and Title are required.' });
    }

    try {
        const chat = await supabaseService.createChat(userId, title);
        res.status(201).json(chat);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Fetch User Chats
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const chats = await supabaseService.getChats(userId);
        res.json(chats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Delete Chat
router.delete('/:id/user/:userId', async (req, res) => {
    const chatId = req.params.id;
    const userId = req.params.userId;

    try {
        await supabaseService.deleteChat(userId, chatId);
        res.json({ message: 'Chat deleted successfully.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3.5 Rename Chat
router.put('/:id/user/:userId', async (req, res) => {
    const chatId = req.params.id;
    const userId = req.params.userId;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    try {
        const chat = await supabaseService.renameChat(userId, chatId, title);
        res.json(chat);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Fetch Message Logs for Chat
router.get('/:chatId/messages', async (req, res) => {
    const chatId = req.params.chatId;
    try {
        const messages = await supabaseService.getMessages(chatId);
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Send message (RAG Inquiry)
router.post('/:chatId/messages', async (req, res) => {
    const chatId = req.params.chatId;
    const {
        userId,
        content,
        lang,
        provider,
        apiKey,
        ollamaUrl,
        ollamaModel
    } = req.body;

    if (!userId || !content) {
        return res.status(400).json({ error: 'User ID and Message Content are required.' });
    }

    try {
        // A. Insert User message
        const userMsg = await supabaseService.createMessage(chatId, 'user', content);

        // B. Invoke RAG search pipeline
        const result = await ragService.queryAssistant(
            userId,
            content,
            lang || 'en',
            provider || 'gemini',
            apiKey || null,
            ollamaUrl || null,
            ollamaModel || 'llama3'
        );

        let assistantContent = result.response;
        
        // C. Formulate citation string
        if (result.citations && result.citations.length > 0) {
            let citationsStr = '\n\n**Sources used:**\n';
            for (const doc of result.citations) {
                const link = doc.file_url || '#';
                citationsStr += `- [${doc.title}](${link})\n`;
            }
            assistantContent += citationsStr;
        }

        // D. Insert Assistant reply
        const assistantMsg = await supabaseService.createMessage(chatId, 'assistant', assistantContent);

        res.json({
            userMessage: userMsg,
            assistantMessage: assistantMsg
        });
    } catch (e) {
        console.error('Send message route error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// 6. Download Chat Log PDF
router.get('/:chatId/download', async (req, res) => {
    const chatId = req.params.chatId;
    const { title } = req.query;

    try {
        const messages = await supabaseService.getMessages(chatId);
        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Cannot export an empty chat history.' });
        }

        const pdfBuffer = await pdfService.generateChatPDF(title || 'Gram Sahayak AI Transcript', messages);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="gram_sahayak_chat_${chatId.substring(0, 8)}.pdf"`);
        res.send(pdfBuffer);
    } catch (e) {
        console.error('Chat PDF generation route error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

export default router;
