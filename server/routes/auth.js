import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateUniqueUserId } from '../utils/idGenerator.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiting.js';
import { validateBody, authSchema, loginSchema } from '../middleware/validation.js';
import { 
  generateTokenPair, 
  verifyRefreshToken, 
  revokeRefreshToken, 
  revokeAllUserRefreshTokens 
} from '../utils/tokenUtils.js';

const router = express.Router();
const prisma = new PrismaClient();

// Register endpoint with validation and rate limiting
router.post('/register', authLimiter, validateBody(authSchema), async (req, res) => {
  try {
    const { email, password, displayName } = req.body;    // Validate display name if provided
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

// Login endpoint with validation and rate limiting
router.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;    // Find user
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

    // Generate token pair (access + refresh)
    const tokens = generateTokenPair(user.id, user.email);
    
    console.log(`User logged in successfully: ${user.email} (ID: ${user.id})`);
    
    res.json({ 
      ...tokens,
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

// Logout endpoint - revoke refresh token
router.post('/logout', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        revokeRefreshToken(decoded.tokenId);
      } catch (error) {
        // Even if refresh token is invalid, we'll still return success
        console.log('Invalid refresh token during logout:', error.message);
      }
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ message: 'Logged out successfully' }); // Always succeed for logout
  }
});

// Refresh token endpoint
router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token is required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    if (!user) {
      // Revoke the refresh token if user no longer exists
      revokeRefreshToken(decoded.tokenId);
      return res.status(401).json({
        error: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user.id, user.email);
    
    // Optionally revoke the old refresh token (rotate tokens)
    revokeRefreshToken(decoded.tokenId);
    
    res.json({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({
      error: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

export default router;