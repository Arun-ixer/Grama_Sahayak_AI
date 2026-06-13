import express from 'express';
import { supabaseService } from '../services/supabaseService.js';

const router = express.Router();

// 1. Sign Up Route
router.post('/signup', async (req, res) => {
    const { email, password, name, state, district, occupation, preferredLanguage } = req.body;
    
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, Email, and Password are required.' });
    }

    try {
        const { data, error } = await supabaseService.supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (error) throw error;
        if (!data.user) throw new Error('Failed to create account.');

        // Initialize user database profile
        const profile = await supabaseService.upsertProfile(
            data.user.id,
            name,
            state || '',
            district || '',
            occupation || '',
            preferredLanguage || 'en'
        );

        res.status(201).json({ user: data.user, profile });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and Password are required.' });
    }

    try {
        const { data, error } = await supabaseService.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (!data.user) throw new Error('Authentication failed.');

        // Fetch or create profile stub
        let profile = await supabaseService.getProfile(data.user.id);
        if (!profile) {
            profile = await supabaseService.upsertProfile(
                data.user.id,
                email.split('@')[0],
                '',
                '',
                '',
                'en'
            );
        }

        res.json({
            user: data.user,
            session: data.session,
            profile
        });
    } catch (e) {
        res.status(401).json({ error: e.message });
    }
});

// 3. Developer Auto-Login Bypass Route
router.post('/autologin', async (req, res) => {
    const email = process.env.DEFAULT_USER_EMAIL;
    const password = process.env.DEFAULT_USER_PASSWORD;

    if (!email || !password) {
        return res.json({ autologin: false });
    }

    try {
        const { data, error } = await supabaseService.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        const profile = await supabaseService.getProfile(data.user.id);

        res.json({
            user: data.user,
            session: data.session,
            profile
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Get Profile Route
router.get('/profile/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const profile = await supabaseService.getProfile(userId);
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }
        res.json(profile);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Update Profile Route
router.post('/profile/:id', async (req, res) => {
    const userId = req.params.id;
    const { name, state, district, occupation, preferredLanguage } = req.body;

    try {
        const profile = await supabaseService.upsertProfile(
            userId,
            name,
            state,
            district,
            occupation,
            preferredLanguage
        );
        res.json(profile);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
