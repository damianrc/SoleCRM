import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access tokens
const REFRESH_TOKEN_EXPIRY = '7d'; // Longer-lived refresh tokens

// In production, you'd store refresh tokens in a database or Redis
// For now, we'll use an in-memory store (will be lost on server restart)
const refreshTokenStore = new Map();

export const generateTokenPair = (userId, email) => {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  
  if (!jwtSecret || jwtSecret === 'your-secret-key') {
    throw new Error('JWT_SECRET not properly configured');
  }

  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    { 
      userId,
      email,
      type: 'access'
    }, 
    jwtSecret, 
    { 
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'solecrm',
      audience: 'solecrm-users'
    }
  );

  // Generate refresh token (longer-lived)
  const refreshTokenId = crypto.randomBytes(32).toString('hex');
  const refreshToken = jwt.sign(
    { 
      userId,
      email,
      tokenId: refreshTokenId,
      type: 'refresh'
    }, 
    refreshSecret, 
    { 
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'solecrm',
      audience: 'solecrm-users'
    }
  );

  // Store refresh token (in production, use database/Redis)
  refreshTokenStore.set(refreshTokenId, {
    userId,
    email,
    createdAt: new Date(),
    lastUsed: new Date()
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: REFRESH_TOKEN_EXPIRY
  };
};

export const verifyRefreshToken = (refreshToken) => {
  try {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, refreshSecret);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if refresh token exists in store
    const tokenData = refreshTokenStore.get(decoded.tokenId);
    if (!tokenData) {
      throw new Error('Refresh token not found or expired');
    }

    // Update last used timestamp
    tokenData.lastUsed = new Date();
    refreshTokenStore.set(decoded.tokenId, tokenData);

    return {
      userId: decoded.userId,
      email: decoded.email,
      tokenId: decoded.tokenId
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const revokeRefreshToken = (tokenId) => {
  return refreshTokenStore.delete(tokenId);
};

export const revokeAllUserRefreshTokens = (userId) => {
  let revokedCount = 0;
  for (const [tokenId, tokenData] of refreshTokenStore.entries()) {
    if (tokenData.userId === userId) {
      refreshTokenStore.delete(tokenId);
      revokedCount++;
    }
  }
  return revokedCount;
};

// Clean up expired refresh tokens (should be run periodically)
export const cleanupExpiredTokens = () => {
  const now = new Date();
  const expiryTime = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  let cleanedCount = 0;

  for (const [tokenId, tokenData] of refreshTokenStore.entries()) {
    if (now - tokenData.createdAt > expiryTime) {
      refreshTokenStore.delete(tokenId);
      cleanedCount++;
    }
  }

  return cleanedCount;
};

// Middleware to verify access token with proper error handling
export const verifyAccessToken = (token) => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecret);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return {
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};
