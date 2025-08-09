import { z } from 'zod';

// Validation schemas
export const contactSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  suburb: z.string()
    .max(255, 'Suburb must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  contactType: z.enum(['BUYER', 'SELLER', 'PAST_CLIENT', 'LEAD'])
    .optional()
    .default('LEAD'),
  leadSource: z.string()
    .max(255, 'Lead source must be less than 255 characters')
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform(val => val === '' ? null : val),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'])
    .optional()
    .default('NEW')
});

export const contactUpdateSchema = contactSchema.partial();

export const taskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable()
    .transform(val => val === '' || val === null ? null : val),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .optional()
    .default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('PENDING'),
  dueDate: z.string()
    .optional()
    .nullable()
    .transform(val => {
      if (!val || val === '' || val === null) return null;
      // Try to parse the date to validate it
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return val;
    })
});

export const noteSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10000 characters')
    .trim()
});

export const activitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'WHATSAPP']),
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable()
    .transform(val => val === '' || val === null ? null : val)
});

export const authSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&#]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  displayName: z.string()
    .max(255, 'Display name must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  jobTitle: z.string()
    .max(50, 'Job title must be 50 characters or less')
    .optional()
    .or(z.literal(''))
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required')
});

export const userUpdateSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .optional(),
  displayName: z.string()
    .max(255, 'Display name must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  jobTitle: z.string()
    .max(50, 'Job title must be 50 characters or less')
    .optional()
    .or(z.literal('')),
  currentPassword: z.string()
    .min(1, 'Current password is required')
    .optional()
}).refine((data) => {
  // If email is being updated, current password is required
  if (data.email && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required when updating email",
  path: ["currentPassword"]
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&#]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string()
    .min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform(val => parseInt(val))
    .default('1'),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(val => Math.min(parseInt(val), 1000)) // Cap at 1000
    .default('100')
});

export const contactFilterSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'])
    .optional(),
  contactType: z.enum(['BUYER', 'SELLER', 'PAST_CLIENT', 'LEAD'])
    .optional(),
  search: z.string()
    .max(255, 'Search term must be less than 255 characters')
    .optional()
});

// Validation middleware factory
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        console.error(`❌ Validation failed for ${req.method} ${req.route?.path || req.url}:`, {
          body: req.body,
          errors: result.error?.errors || result.error
        });
        
        // Handle both ZodError and other error formats
        const errors = result.error?.errors ? result.error.errors.map(err => ({
          field: err.path?.join?.('.') || 'unknown',
          message: err.message || 'Invalid input',
          code: err.code || 'INVALID'
        })) : [{
          field: 'unknown',
          message: result.error?.message || 'Validation failed',
          code: 'VALIDATION_ERROR'
        }];
        
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }
      
      // Replace req.body with validated and transformed data
      req.body = result.data;
      console.log(`✅ Validation passed for ${req.method} ${req.route?.path || req.url}:`, result.data);
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Validation service error',
        code: 'VALIDATION_SERVICE_ERROR'
      });
    }
  };
};

// Query validation middleware factory
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          error: 'Query validation failed',
          code: 'QUERY_VALIDATION_ERROR',
          details: errors
        });
      }
      
      // Replace req.query with validated and transformed data
      req.query = result.data;
      next();
    } catch (error) {
      console.error('Query validation middleware error:', error);
      return res.status(500).json({
        error: 'Query validation service error',
        code: 'QUERY_VALIDATION_SERVICE_ERROR'
      });
    }
  };
};

// Bulk operations validation
export const bulkContactsSchema = z.object({
  contacts: z.array(contactSchema)
    .min(1, 'At least one contact is required')
    .max(1000, 'Maximum 1000 contacts allowed per import')
});

export const bulkDeleteSchema = z.object({
  contactIds: z.array(z.string().min(1, 'Contact ID cannot be empty'))
    .min(1, 'At least one contact ID is required')
    .max(1000, 'Maximum 1000 contacts can be deleted at once')
});
