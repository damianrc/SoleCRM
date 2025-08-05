import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { userUpdateLimiter } from '../middleware/rateLimiting.js';
import { validateBody, userUpdateSchema, passwordChangeSchema } from '../middleware/validation.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        profileImage: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: user
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update user email with validation
router.put('/email', authenticateToken, userUpdateLimiter, validateBody(userUpdateSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, currentPassword } = req.body;

    // Input validation
    if (!email || !currentPassword) {
      return res.status(400).json({
        error: 'Email and current password are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true
      }
    });

    if (!currentUser) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }

    // Check if new email is different from current
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === currentUser.email) {
      return res.status(400).json({
        error: 'New email must be different from current email',
        code: 'SAME_EMAIL'
      });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        error: 'Email address is already in use',
        code: 'EMAIL_TAKEN'
      });
    }

    // Update email
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    console.log(`User ${userId} updated email to: ${normalizedEmail}`);

    res.json({
      message: 'Email updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user email:', error);
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Email address is already in use',
        code: 'EMAIL_TAKEN'
      });
    }

    res.status(500).json({
      error: 'Failed to update email',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update user password with validation
router.put('/password', authenticateToken, userUpdateLimiter, validateBody(passwordChangeSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Input validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Current password, new password, and confirm password are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'New password and confirm password do not match',
        code: 'PASSWORD_MISMATCH'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'New password must be different from current password',
        code: 'SAME_PASSWORD'
      });
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true
      }
    });

    if (!currentUser) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }

    // Hash new password
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    console.log(`User ${userId} updated password successfully`);

    res.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({
      error: 'Failed to update password',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update user display name
router.put('/display-name', authenticateToken, userUpdateLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName } = req.body;

    // Input validation
    if (displayName !== null && displayName !== undefined && displayName.trim() === '') {
      return res.status(400).json({
        error: 'Display name cannot be empty. Use null to remove display name.',
        code: 'INVALID_DISPLAY_NAME'
      });
    }

    // Trim display name if provided, or set to null
    const normalizedDisplayName = displayName && displayName.trim() ? displayName.trim() : null;

    // Update display name
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { displayName: normalizedDisplayName },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    console.log(`User ${userId} updated display name to: ${normalizedDisplayName || 'null'}`);

    res.json({
      message: 'Display name updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user display name:', error);
    res.status(500).json({
      error: 'Failed to update display name',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update user profile image
router.put('/profile-image', authenticateToken, userUpdateLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileImage } = req.body;

    // Input validation
    if (profileImage !== null && profileImage !== undefined) {
      // Validate base64 image format
      const base64Regex = /^data:image\/(jpeg|jpg|png|gif|bmp|webp);base64,/;
      if (!base64Regex.test(profileImage)) {
        return res.status(400).json({
          error: 'Invalid image format. Please provide a valid base64 encoded image.',
          code: 'INVALID_IMAGE_FORMAT'
        });
      }

      // Check image size (limit to ~2MB base64 encoded)
      if (profileImage.length > 2.7 * 1024 * 1024) {
        return res.status(400).json({
          error: 'Image too large. Please use an image smaller than 2MB.',
          code: 'IMAGE_TOO_LARGE'
        });
      }
    }

    // Update profile image (null to remove)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage },
      select: {
        id: true,
        email: true,
        displayName: true,
        profileImage: true
      }
    });

    console.log(`User ${userId} updated profile image: ${profileImage ? 'set' : 'removed'}`);

    res.json({
      message: profileImage ? 'Profile image updated successfully' : 'Profile image removed successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user profile image:', error);
    res.status(500).json({
      error: 'Failed to update profile image',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
