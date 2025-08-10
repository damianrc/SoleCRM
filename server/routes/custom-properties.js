import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation helper functions
const validateCreateProperty = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.fieldKey || typeof data.fieldKey !== 'string' || !/^[a-z_][a-z0-9_]*$/.test(data.fieldKey)) {
    errors.push('Field key must be a valid identifier (lowercase letters, numbers, underscores)');
  }
  
  const validFieldTypes = ['TEXT', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'DATETIME', 'BOOLEAN', 'DROPDOWN', 'MULTISELECT', 'URL', 'TEXTAREA'];
  if (!data.fieldType || !validFieldTypes.includes(data.fieldType)) {
    errors.push(`Field type must be one of: ${validFieldTypes.join(', ')}`);
  }
  
  return errors;
};

// GET /api/custom-properties - List all custom properties for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const properties = await prisma.customPropertyDefinition.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(properties);
  } catch (error) {
    console.error('Error fetching custom properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/custom-properties - Create new custom property
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validationErrors = validateCreateProperty(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation error', details: validationErrors });
    }

    const { name, fieldKey, fieldType, isRequired = false, defaultValue, sortOrder = 0 } = req.body;

    // Check if fieldKey is unique for this user
    const existingProperty = await prisma.customPropertyDefinition.findUnique({
      where: {
        userId_fieldKey: {
          userId,
          fieldKey,
        },
      },
    });

    if (existingProperty) {
      return res.status(400).json({ error: 'Field key already exists' });
    }

    const property = await prisma.customPropertyDefinition.create({
      data: {
        name,
        fieldKey,
        fieldType,
        isRequired,
        defaultValue,
        sortOrder,
        userId,
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating custom property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/custom-properties/:id - Update custom property
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const propertyId = req.params.id;
    const updates = req.body;

    // Check if property belongs to user
    const existingProperty = await prisma.customPropertyDefinition.findFirst({
      where: {
        id: propertyId,
        userId,
      },
    });

    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // If updating fieldKey, check uniqueness
    if (updates.fieldKey && updates.fieldKey !== existingProperty.fieldKey) {
      const duplicateProperty = await prisma.customPropertyDefinition.findUnique({
        where: {
          userId_fieldKey: {
            userId,
            fieldKey: updates.fieldKey,
          },
        },
      });

      if (duplicateProperty) {
        return res.status(400).json({ error: 'Field key already exists' });
      }
    }

    const updatedProperty = await prisma.customPropertyDefinition.update({
      where: { id: propertyId },
      data: updates,
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json(updatedProperty);
  } catch (error) {
    console.error('Error updating custom property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/custom-properties/:id - Delete custom property
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const propertyId = req.params.id;

    // Check if property belongs to user
    const existingProperty = await prisma.customPropertyDefinition.findFirst({
      where: {
        id: propertyId,
        userId,
      },
    });

    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.customPropertyDefinition.update({
      where: { id: propertyId },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting custom property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/custom-properties/:id/options - Add option to dropdown/multiselect
router.post('/:id/options', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const propertyId = req.params.id;
    const { label, value, sortOrder = 0 } = req.body;

    if (!label || !value) {
      return res.status(400).json({ error: 'Label and value are required' });
    }

    // Check if property belongs to user and supports options
    const property = await prisma.customPropertyDefinition.findFirst({
      where: {
        id: propertyId,
        userId,
        fieldType: { in: ['DROPDOWN', 'MULTISELECT'] },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or does not support options' });
    }

    const option = await prisma.customPropertyOption.create({
      data: {
        label,
        value,
        sortOrder,
        propertyId,
      },
    });

    res.status(201).json(option);
  } catch (error) {
    console.error('Error creating property option:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/custom-properties/:id/options/:optionId - Update option
router.put('/:id/options/:optionId', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const propertyId = req.params.id;
    const optionId = req.params.optionId;
    const updates = req.body;

    // Check if property belongs to user
    const property = await prisma.customPropertyDefinition.findFirst({
      where: {
        id: propertyId,
        userId,
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const updatedOption = await prisma.customPropertyOption.update({
      where: {
        id: optionId,
        propertyId,
      },
      data: updates,
    });

    res.json(updatedOption);
  } catch (error) {
    console.error('Error updating property option:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/custom-properties/:id/options/:optionId - Delete option
router.delete('/:id/options/:optionId', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const propertyId = req.params.id;
    const optionId = req.params.optionId;

    // Check if property belongs to user
    const property = await prisma.customPropertyDefinition.findFirst({
      where: {
        id: propertyId,
        userId,
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.customPropertyOption.update({
      where: {
        id: optionId,
        propertyId,
      },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting property option:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;