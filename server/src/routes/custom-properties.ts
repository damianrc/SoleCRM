import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createPropertySchema = z.object({
  name: z.string().min(1).max(100),
  fieldKey: z.string().min(1).max(50).regex(/^[a-z_][a-z0-9_]*$/),
  fieldType: z.enum(['TEXT', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'DATETIME', 'BOOLEAN', 'DROPDOWN', 'MULTISELECT', 'URL', 'TEXTAREA']),
  isRequired: z.boolean().default(false),
  defaultValue: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

const updatePropertySchema = createPropertySchema.partial();

const createOptionSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).default(0),
});

// GET /api/custom-properties - List all custom properties for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id; // Assuming you have auth middleware
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

    const validatedData = createPropertySchema.parse(req.body);

    // Check if fieldKey is unique for this user
    const existingProperty = await prisma.customPropertyDefinition.findUnique({
      where: {
        userId_fieldKey: {
          userId,
          fieldKey: validatedData.fieldKey,
        },
      },
    });

    if (existingProperty) {
      return res.status(400).json({ error: 'Field key already exists' });
    }

    const property = await prisma.customPropertyDefinition.create({
      data: {
        ...validatedData,
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
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
    const validatedData = updatePropertySchema.parse(req.body);

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
    if (validatedData.fieldKey && validatedData.fieldKey !== existingProperty.fieldKey) {
      const duplicateProperty = await prisma.customPropertyDefinition.findUnique({
        where: {
          userId_fieldKey: {
            userId,
            fieldKey: validatedData.fieldKey,
          },
        },
      });

      if (duplicateProperty) {
        return res.status(400).json({ error: 'Field key already exists' });
      }
    }

    const updatedProperty = await prisma.customPropertyDefinition.update({
      where: { id: propertyId },
      data: validatedData,
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json(updatedProperty);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
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
    const validatedData = createOptionSchema.parse(req.body);

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
        ...validatedData,
        propertyId,
      },
    });

    res.status(201).json(option);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
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
    const validatedData = createOptionSchema.partial().parse(req.body);

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
      data: validatedData,
    });

    res.json(updatedOption);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
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