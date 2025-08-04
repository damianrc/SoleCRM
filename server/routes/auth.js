import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { generateUniqueUserId } from '../utils/idGenerator.js';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: '⚠️ Too many login attempts. Please wait 1 minute before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Register endpoint
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
        code: 'WEAK_PASSWORD'
      });
    }

    // Validate display name if provided
    const normalizedDisplayName = displayName && displayName.trim() ? displayName.trim() : null;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'An account with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password with higher salt rounds for production
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate a unique 10-digit user ID
    const userId = await generateUniqueUserId(prisma);
    
    // Create user with custom ID
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase().trim(),
        displayName: normalizedDisplayName,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    console.log(`New user registered: ${user.email} (ID: ${user.id})`);
    
    res.status(201).json({ 
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      console.error('CRITICAL: JWT_SECRET not properly configured!');
      return res.status(500).json({
        error: 'Authentication service unavailable',
        code: 'AUTH_CONFIG_ERROR'
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email 
      }, 
      jwtSecret, 
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'solecrm',
        audience: 'solecrm-users'
      }
    );
    
    console.log(`User logged in successfully: ${user.email} (ID: ${user.id})`);
    
    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.',
      code: 'LOGIN_ERROR'
    });
  }
});

// Token verification endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      return res.status(500).json({
        error: 'Authentication service unavailable',
        code: 'AUTH_CONFIG_ERROR'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ 
      valid: true,
      user 
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Token verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Logout endpoint (optional, for token blacklisting if implemented)
router.post('/logout', (req, res) => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just send a success response
  res.json({ message: 'Logged out successfully' });
});

export default router;