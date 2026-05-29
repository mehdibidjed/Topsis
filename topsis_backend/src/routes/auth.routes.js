import express from 'express';
import { register, login, getMe, googleAuth } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

// Google OAuth via ID token from frontend
router.post('/google', googleAuth);

export default router;
