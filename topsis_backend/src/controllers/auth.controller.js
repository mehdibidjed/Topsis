import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.middleware.js';

// ── Register ───────────────────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = generateToken({ id: user.id });

        res.status(201).json({ success: true, user, token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server configuration requires "users" table creation.' });
    }
};

// ── Login ──────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        
        if (!user.password_hash) {
           return res.status(401).json({ success: false, message: 'Password auth not enabled for this account (used google perhaps)' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken({ id: user.id });

        res.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server configuration requires "users" table creation.' });
    }
};

// ── Get Me (from token) ────────────────────────────────────────────────────
export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query('SELECT id, name, email, google_id FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

import { OAuth2Client } from 'google-auth-library';

// ── Real Google OAuth Flow (Access Token Verification via Profile API) ─────────────────────────
export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body; // Actually access_token from frontend
        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Google token is required' });
        }

        // Fetch user profile using the access token
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        
        if (!response.ok) {
             return res.status(401).json({ success: false, message: 'Invalid Google access token' });
        }
        const payload = await response.json();

        const { sub: googleId, email, name, picture } = payload;

        let userResult = await pool.query('SELECT id, name, email FROM users WHERE google_id = $1', [googleId]);
        
        let user;
        if (userResult.rows.length === 0) {
            // Check if email already exists
            const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (emailCheck.rows.length > 0) {
                // Link google ID to existing email
                const linkResult = await pool.query('UPDATE users SET google_id = $1 WHERE email = $2 RETURNING id, name, email', [googleId, email]);
                user = linkResult.rows[0];
            } else {
                // Create new user
                const createResult = await pool.query(
                    'INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING id, name, email',
                    [name, email, googleId]
                );
                user = createResult.rows[0];
            }
        } else {
            user = userResult.rows[0];
        }

        const token = generateToken({ id: user.id });

        res.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, picture },
            token
        });
    } catch (error) {
        console.error('Google ID Token Verification error:', error);
        res.status(500).json({ success: false, message: 'Server configuration requires valid setup.' });
    }
};
