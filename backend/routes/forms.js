import express from 'express';
import { formService, FORMS_METADATA } from '../services/formService.js';

const router = express.Router();

// 1. Get Available Form Lists
router.get('/', (req, res) => {
    const lang = req.query.lang || 'en';
    const forms = formService.getAvailableForms(lang);
    res.json(forms);
});

// 2. Fetch Detailed Metadata for specific form (including its localized fields)
router.get('/:formId', (req, res) => {
    const { formId } = req.params;
    const form = FORMS_METADATA[formId];
    if (!form) {
        return res.status(404).json({ error: 'Form template not found.' });
    }
    res.json(form);
});

// 3. Prefill fields from user profile
router.post('/prefill', (req, res) => {
    const { formId, profile } = req.body;
    if (!formId) {
        return res.status(400).json({ error: 'Form ID is required.' });
    }
    try {
        const values = formService.prefillFormFromProfile(formId, profile || {});
        res.json(values);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Extract parameters from user dialog statement (AI Form Fill slot-filling)
router.post('/extract', async (req, res) => {
    const {
        formId,
        currentValues,
        userMessage,
        lang,
        apiKey,
        provider,
        ollamaUrl,
        ollamaModel
    } = req.body;

    if (!formId || !currentValues || !userMessage) {
        return res.status(400).json({ error: 'Form ID, Current Values, and User Message are required.' });
    }

    try {
        const updatedValues = await formService.aiExtractFields(
            formId,
            currentValues,
            userMessage,
            lang || 'en',
            apiKey || null,
            provider || 'gemini',
            ollamaUrl || null,
            ollamaModel || 'llama3'
        );
        res.json(updatedValues);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Generate Formal application letter draft
router.post('/draft', async (req, res) => {
    const {
        formId,
        values,
        lang,
        apiKey,
        provider,
        ollamaUrl,
        ollamaModel
    } = req.body;

    if (!formId || !values) {
        return res.status(400).json({ error: 'Form ID and Form Values are required.' });
    }

    try {
        const draftText = await formService.generateFormalDraft(
            formId,
            values,
            lang || 'en',
            apiKey || null,
            provider || 'gemini',
            ollamaUrl || null,
            ollamaModel || 'llama3'
        );
        res.json({ draft: draftText });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
