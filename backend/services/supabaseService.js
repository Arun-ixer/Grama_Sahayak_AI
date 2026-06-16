import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('ws');
globalThis.WebSocket = WebSocket;

dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

class SupabaseService {
    constructor() {
        this.supabase = supabase;
    }

    isConfigured() {
        return !!this.supabase;
    }

    // --- Profile Management ---
    async getProfile(userId) {
        if (!this.isConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('getProfile Error:', e.message);
            return null;
        }
    }

    async upsertProfile(userId, name, state, district, occupation, preferredLanguage, provider, chatApiKey, geminiApiKey) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        const profileData = {
            id: userId,
            name,
            state,
            district,
            occupation,
            preferred_language: preferredLanguage,
            provider,
            chat_api_key: chatApiKey,
            gemini_api_key: geminiApiKey
        };
        try {
            const { data, error } = await supabase
                .from('profiles')
                .upsert(profileData)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('upsertProfile Error:', e.message);
            throw e;
        }
    }

    // --- Document Operations ---
    async createDocument(userId, title, fileUrl) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        try {
            const { data, error } = await supabase
                .from('documents')
                .insert({ user_id: userId, title, file_url: fileUrl })
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('createDocument Error:', e.message);
            throw e;
        }
    }

    async getDocuments(userId) {
        if (!this.isConfigured()) return [];
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', userId)
                .order('upload_date', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('getDocuments Error:', e.message);
            return [];
        }
    }

    async deleteDocument(userId, documentId) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        try {
            // Retrieve document name if we want to delete it from storage too
            const { data: doc, error: getErr } = await supabase
                .from('documents')
                .select('file_url')
                .eq('id', documentId)
                .eq('user_id', userId)
                .single();
            
            if (!getErr && doc) {
                try {
                    const urlParts = doc.file_url.split('/storage/v1/object/public/scheme_documents/');
                    if (urlParts.length > 1) {
                        const storagePath = urlParts[1];
                        await supabase.storage.from('scheme_documents').remove([storagePath]);
                    }
                } catch (stErr) {
                    console.error('Storage deletion error:', stErr.message);
                }
            }

            const { data, error } = await supabase
                .from('documents')
                .delete()
                .eq('id', documentId)
                .eq('user_id', userId)
                .select();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('deleteDocument Error:', e.message);
            throw e;
        }
    }

    // --- Chunk inserts & vector similarity query ---
    async insertDocumentChunks(chunks) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        try {
            const { data, error } = await supabase
                .from('document_chunks')
                .insert(chunks)
                .select();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('insertChunks Error:', e.message);
            throw e;
        }
    }

    async matchDocumentChunks(userId, queryEmbedding, matchThreshold = 0.3, matchCount = 4) {
        if (!this.isConfigured()) return [];
        try {
            const { data, error } = await supabase.rpc('match_document_chunks', {
                query_embedding: queryEmbedding,
                match_threshold: matchThreshold,
                match_count: matchCount,
                filter_user_id: userId
            });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('matchChunks Error:', e.message);
            return [];
        }
    }

    // --- Supabase Storage upload ---
    async uploadDocumentToStorage(fileName, fileBuffer) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        const bucketName = 'scheme_documents';

        // Check if bucket exists, create if missing
        try {
            const { error: getErr } = await supabase.storage.getBucket(bucketName);
            if (getErr) {
                await supabase.storage.createBucket(bucketName, { public: true });
            }
        } catch (bucketErr) {
            console.error('Bucket check/creation error:', bucketErr.message);
        }

        try {
            const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
            const uniqueName = `${Date.now()}_${cleanName}`;
            
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(uniqueName, fileBuffer, {
                    contentType: 'application/pdf',
                    duplex: 'half'
                });
            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(uniqueName);
                
            return publicUrlData.publicUrl;
        } catch (e) {
            console.error('uploadToStorage Error:', e.message);
            throw e;
        }
    }

    // --- Chats and messages ---
    async createChat(userId, title) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        try {
            const { data, error } = await supabase
                .from('chats')
                .insert({ user_id: userId, title })
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('createChat Error:', e.message);
            throw e;
        }
    }

    async getChats(userId) {
        if (!this.isConfigured()) return [];
        try {
            const { data, error } = await supabase
                .from('chats')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('getChats Error:', e.message);
            return [];
        }
    }

    async deleteChat(userId, chatId) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        try {
            const { data, error } = await supabase
                .from('chats')
                .delete()
                .eq('id', chatId)
                .eq('user_id', userId)
                .select();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('deleteChat Error:', e.message);
            throw e;
        }
    }

    async renameChat(userId, chatId, title) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        try {
            const { data, error } = await supabase
                .from('chats')
                .update({ title })
                .eq('id', chatId)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('renameChat Error:', e.message);
            throw e;
        }
    }

    async createMessage(chatId, role, content) {
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({ chat_id: chatId, role, content })
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('createMessage Error:', e.message);
            throw e;
        }
    }

    async getMessages(chatId) {
        if (!this.isConfigured()) return [];
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('getMessages Error:', e.message);
            return [];
        }
    }
}

export const supabaseService = new SupabaseService();
