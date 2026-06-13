import fs from 'fs';
import { extractText, getDocumentProxy } from 'unpdf';
import PDFDocument from 'pdfkit';

class PDFService {
    async extractTextFromPDF(fileBuffer) {
        try {
            const pdfProxy = await getDocumentProxy(new Uint8Array(fileBuffer));
            const { text } = await extractText(pdfProxy, { mergePages: true });
            return text || '';
        } catch (e) {
            console.error('PDF Text Extraction Error:', e.message);
            throw e;
        }
    }

    chunkText(text, chunkSize = 700, overlap = 100) {
        // Strip null / invalid unicode characters that PostgreSQL cannot store
        const sanitized = (text || '').replace(/\u0000/g, '').replace(/\x00/g, '');
        // Clean up excessive spacing
        const cleanText = sanitized.replace(/\s+/g, ' ').trim();
        const words = cleanText.split(' ');
        
        const chunks = [];
        let currentChunk = [];
        let currentLen = 0;
        
        for (const word of words) {
            currentChunk.push(word);
            currentLen += word.length + 1; // +1 for space
            
            if (currentLen >= chunkSize) {
                chunks.push(currentChunk.join(' '));
                // Overlap: retain last few words (roughly 12-15 words matching overlap chars)
                const overlapWordCount = Math.max(1, Math.floor(overlap / 8));
                currentChunk = currentChunk.slice(-overlapWordCount);
                currentLen = currentChunk.reduce((acc, w) => acc + w.length + 1, 0);
            }
        }
        
        if (currentChunk.length > 0 && currentChunk.join(' ').trim()) {
            chunks.push(currentChunk.join(' '));
        }
        
        return chunks;
    }

    async generateChatPDF(chatTitle, messages) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Detect system fonts for Hindi/Telugu unicode support on Windows
                let fontPath = null;
                const winFonts = [
                    'C:\\Windows\\Fonts\\arial.ttf',
                    'C:\\Windows\\Fonts\\mangal.ttf',
                    'C:\\Windows\\Fonts\\gautami.ttf',
                    'C:\\Windows\\Fonts\\segoeui.ttf'
                ];
                for (const p of winFonts) {
                    if (fs.existsSync(p)) {
                        fontPath = p;
                        break;
                    }
                }

                if (fontPath) {
                    doc.registerFont('UnicodeFont', fontPath);
                    doc.font('UnicodeFont');
                } else {
                    doc.font('Helvetica');
                }

                // Draw header
                doc.fontSize(16).fillColor('#1f2937').text(chatTitle, { align: 'center' });
                doc.moveDown(0.5);
                
                // Draw horizontal line
                doc.lineWidth(1).strokeColor('#e5e7eb').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(1);

                // Write messages
                for (const msg of messages) {
                    const role = msg.role || 'user';
                    const content = msg.content || '';
                    const createdAt = msg.created_at || '';
                    
                    const roleTitle = role === 'user' ? 'Citizen' : 'Gram Sahayak Assistant';
                    const timeStr = createdAt ? createdAt.substring(0, 16).replace('T', ' ') : '';
                    
                    // Metadata line
                    doc.fontSize(10).fillColor('#4b5563');
                    if (fontPath) {
                        doc.text(`${roleTitle} (${timeStr})`, { oblique: true });
                    } else {
                        doc.font('Helvetica-Bold').text(`${roleTitle} (${timeStr})`);
                    }
                    doc.moveDown(0.2);

                    // Message text
                    doc.fontSize(10).fillColor('#111827');
                    if (fontPath) {
                        doc.text(content);
                    } else {
                        // Strip unicode characters from Helvetica to prevent PDFKit errors
                        const asciiContent = content.replace(/[^\x00-\x7F]/g, '');
                        doc.font('Helvetica').text(asciiContent);
                    }
                    doc.moveDown(1);
                }

                doc.end();
            } catch (e) {
                reject(e);
            }
        });
    }
}

export const pdfService = new PDFService();
