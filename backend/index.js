import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: true });

// Import Routers
import authRouter from './routes/auth.js';
import documentsRouter from './routes/documents.js';
import chatsRouter from './routes/chats.js';
import formsRouter from './routes/forms.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend communication
app.use(cors({
    origin: '*', // Allows connecting from any development port (e.g. Vite on 5173)
    credentials: true
}));

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Base Route registers
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/forms', formsRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.send('Gram Sahayak AI Backend Server is running. Access API endpoints at /api/...');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

// Chrome DevTools metadata bypass route
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.json({});
});

// Favicon bypass route
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Start listening
const server = app.listen(PORT, () => {
    console.log(`🚀 Gram Sahayak AI Backend running on port ${PORT}`);
});

// Set server timeout to 30 minutes to accommodate very slow local AI inference (like batch embeddings)
server.setTimeout(1800000);
