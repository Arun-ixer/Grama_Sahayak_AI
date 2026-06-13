import { supabaseService } from './supabaseService.js';
import { embeddingService } from './embeddingService.js';
import { llmService } from './llmService.js';

class RAGService {
    async queryAssistant(
        userId,
        query,
        lang = 'en',
        provider = 'gemini',
        customApiKey = null,
        geminiApiKey = null,
        ollamaUrl = null,
        ollamaModel = 'llama3',
        matchThreshold = 0.35,
        matchCount = 10
    ) {
        // 1. Generate query embedding
        let queryEmbedding;
        try {
            queryEmbedding = await embeddingService.getEmbedding(query, true, geminiApiKey);
        } catch (e) {
            console.error('RAG Error (Embedding creation):', e.message);
            throw new Error(`Failed to vectorize search query: ${e.message}`);
        }

        // 2. Retrieve top similarity chunks from Supabase
        const matchingChunks = await supabaseService.matchDocumentChunks(
            userId,
            queryEmbedding,
            matchThreshold,
            matchCount
        );

        // 3. Fetch document citations
        const citations = [];
        const contextTexts = [];

        if (matchingChunks && matchingChunks.length > 0) {
            // Collect unique document IDs
            const docIds = [...new Set(matchingChunks.map(c => c.document_id))];

            const docMap = {};
            if (docIds.length > 0 && supabaseService.isConfigured()) {
                try {
                    const { data: docs, error } = await supabaseService.supabase
                        .from('documents')
                        .select('id, title, file_url')
                        .in('id', docIds);
                    
                    if (!error && docs) {
                        for (const doc of docs) {
                            docMap[doc.id] = doc;
                        }
                    }
                } catch (docErr) {
                    console.error('Error fetching document citations metadata:', docErr.message);
                }
            }

            // Assemble context blocks and unique references
            for (const chunk of matchingChunks) {
                contextTexts.push(chunk.content);
                const docId = chunk.document_id;
                if (docMap[docId] && !citations.some(c => c.id === docId)) {
                    citations.push(docMap[docId]);
                }
            }
        }

        // 4. Prompt compiler
        const langNames = { en: 'English', hi: 'Hindi', te: 'Telugu' };
        const targetLang = langNames[lang.split('-')[0]] || 'English';
        
        const contextStr = contextTexts.length > 0 
            ? contextTexts.join('\n---\n') 
            : 'No specific documents found for this query.';

        const systemInstruction = `
You are "Gram Sahayak AI", a helpful, respectful, and friendly rural service assistant.
Your main goal is to help citizens understand and access government services, welfare schemes, certificate guidelines, and official documents.

Please follow these critical prompting rules:
1. Answer the query using the RETRIEVED DOCUMENTS context whenever possible.
2. Avoid hallucinations. Do not make up facts, URLs, dates, or scheme names.
3. If the answer cannot be found in the retrieved documents, state clearly that you could not find the information, but offer general guidance if appropriate. YOU MUST STILL TRANSLATE THIS RESPONSE INTO ${targetLang}.
4. Explain complex government terminology, requirements, or legal conditions in simple, layperson terms that are easy for a rural citizen to understand.
5. You must respond in the user's selected language: ${targetLang}. If the retrieved documents are in English and the selected language is ${targetLang}, translate the key points and explain them.
6. Provide citations in the text where relevant (e.g. refer to document names).
7. If the retrieved documents do not contain relevant information to answer the user query, or if the user query is a general greeting or unrelated question that you answer without using the retrieved documents, you MUST prepend the exact token "[NOT_RELATED]" (write it exactly like that, do not translate the token) at the very beginning of your response. If you do use the retrieved documents to answer the query, do NOT include "[NOT_RELATED]".
`;

        const prompt = `
Context from uploaded documents:
${contextStr}

User Profile Info:
Language Preference: ${targetLang}

User Query:
${query}

Please generate your response:
`;

        try {
            let responseText = await llmService.generateResponse(
                prompt,
                systemInstruction,
                provider,
                customApiKey,
                ollamaUrl,
                ollamaModel
            );

            let finalCitations = citations;
            const notRelatedRegex = /\[NOT[-_]RELATED\]/i;
            if (notRelatedRegex.test(responseText)) {
                responseText = responseText.replace(notRelatedRegex, '').trim();
                finalCitations = [];
            }

            return {
                response: responseText,
                citations: finalCitations
            };
        } catch (e) {
            console.error('RAG Error (Inference phase):', e.message);
            throw e;
        }
    }
}

export const ragService = new RAGService();
