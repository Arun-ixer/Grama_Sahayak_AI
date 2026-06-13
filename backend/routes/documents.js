import express from 'express';
import multer from 'multer';
import { supabaseService } from '../services/supabaseService.js';
import { pdfService } from '../services/pdfService.js';
import { embeddingService } from '../services/embeddingService.js';

const router = express.Router();

// Configure multer to store uploaded files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // limit file size to 10MB
});

// 1. Upload & Process PDF document
router.post('/upload', upload.single('file'), async (req, res) => {
    const { userId, apiKey } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        console.log(`Processing upload: ${file.originalname} for User ${userId}`);
        
        // A. Upload file to Supabase Storage
        const fileUrl = await supabaseService.uploadDocumentToStorage(file.originalname, file.buffer);

        // B. Insert metadata row
        const document = await supabaseService.createDocument(userId, file.originalname, fileUrl);
        const docId = document.id;

        // C. Extract text content
        const rawText = await pdfService.extractTextFromPDF(file.buffer);
        if (!rawText.trim()) {
            // Delete metadata row to roll back
            await supabaseService.deleteDocument(userId, docId);
            return res.status(400).json({ error: 'We could not extract any readable text from this PDF.' });
        }

        // D. Create semantic chunks
        const chunks = pdfService.chunkText(rawText);
        console.log(`PDF split into ${chunks.length} chunks. Generating embeddings...`);

        // E. Vectorize chunks in batch and insert into database
        console.log(`Generating batch embeddings for ${chunks.length} chunks...`);
        const embeddings = await embeddingService.getEmbeddingsBatch(chunks, apiKey || null);
        const dbChunks = chunks.map((chunk, index) => ({
            document_id: docId,
            content: chunk,
            embedding: embeddings[index]
        }));

        await supabaseService.insertDocumentChunks(dbChunks);

        res.status(201).json({
            message: 'Document uploaded and indexed successfully.',
            document
        });
    } catch (e) {
        console.error('Document processing route error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// 2. Fetch User Documents
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const documents = await supabaseService.getDocuments(userId);
        res.json(documents);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Delete Document
router.delete('/:id/user/:userId', async (req, res) => {
    const documentId = req.params.id;
    const userId = req.params.userId;

    try {
        await supabaseService.deleteDocument(userId, documentId);
        res.json({ message: 'Document deleted successfully.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
