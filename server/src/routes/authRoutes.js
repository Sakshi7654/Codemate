import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// /api/auth/register
router.post('/register', registerUser);

// /api/auth/login
router.post('/login', loginUser);

export default router;