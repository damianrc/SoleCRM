import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../utils/tokenUtils.js';

const prisma = new PrismaClient();

// Main authentication middleware with enhanced security
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token is required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token using utility function
    const decoded = verifyAccessToken(token);
    
    // Verify user still exists in database
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

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    if (error.message === 'Access token expired') {
      return res.status(401).json({
        error: 'Access token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.message === 'Invalid access token') {
      return res.status(401).json({
        error: 'Invalid access token',
        code: 'INVALID_TOKEN'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Development-only middleware (use with extreme caution)
export const devAuthBypass = (req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devUserId = process.env.DEV_USER_ID;
  
  if (!isDevelopment) {
    return authenticateToken(req, res, next);
  }

  if (!devUserId) {
    console.warn('⚠️  DEV_USER_ID not set in development mode');
    return authenticateToken(req, res, next);
  }

  // Try authentication first
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    return authenticateToken(req, res, next);
  }

  // Only bypass if no token and in development
  console.log('🔓 Development bypass: Using test user');
  req.user = { 
    id: devUserId,
    email: 'dev@example.com'
  };
  next();
};

// Optional: Role-based access control middleware
export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // For now, all users have the same role
      // You can extend this when you add roles to your User model
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        error: 'Authorization check failed',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

// Middleware to ensure user can only access their own resources
export const validateResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id || req.params.contactId || req.params.leadId;

      if (!resourceId) {
        return next(); // Skip validation if no resource ID
      }

      let isOwner = false;

      switch (resourceType) {
        case 'contact':
          const contact = await prisma.contact.findFirst({
            where: { id: resourceId, userId },
            select: { id: true }
          });
          isOwner = !!contact;
          break;

        case 'task':
          const task = await prisma.task.findFirst({
            where: { 
              id: resourceId,
              OR: [
                { userId },
                { contact: { userId } }
              ]
            },
            select: { id: true }
          });
          isOwner = !!task;
          break;

        case 'note':
          const note = await prisma.note.findFirst({
            where: { 
              id: resourceId,
              contact: { userId }
            },
            select: { id: true }
          });
          isOwner = !!note;
          break;

        default:
          return next();
      }

      if (!isOwner) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership validation error:', error);
      return res.status(500).json({
        error: 'Access validation failed',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};