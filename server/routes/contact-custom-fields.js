import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Helper function to validate and parse field value based on type
const parseFieldValue = (value, fieldType) => {
  switch (fieldType) {
    case 'NUMBER':
      const num = parseFloat(value);
      return isNaN(num) ? '0' : num.toString();
    case 'BOOLEAN':
      return value === true || value === 'true' ? 'true' : 'false';
    case 'DATE':
    case 'DATETIME':
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? '' : date.toISOString();
      }
      return '';
    case 'MULTISELECT':
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return JSON.stringify([]);
    case 'EMAIL':
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value) ? value : '';
    case 'PHONE':
      // Remove non-numeric characters except +, -, (, ), and spaces
      return typeof value === 'string' ? value.replace(/[^\d+\-() ]/g, '') : '';
    case 'URL':
      try {
        new URL(value);
        return value;
      } catch {
        return '';
      }
    default:
      return typeof value === 'string' ? value : String(value || '');
  }
};

// Helper function to parse stored value for display
const parseStoredValue = (value, fieldType) => {
  switch (fieldType) {
    case 'NUMBER':
      return parseFloat(value) || 0;
    case 'BOOLEAN':
      return value === 'true';
    case 'DATE':
    case 'DATETIME':
      return value ? new Date(value) : null;
    case 'MULTISELECT':
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    default:
      return value;
  }
};

// GET /api/contacts/:id/custom-fields - Get all custom field values for a contact
router.get('/:contactId/custom-fields', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contactId = req.params.contactId;

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId,
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get all custom properties for the user
    const customProperties = await prisma.customPropertyDefinition.findMany({
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

    // Get existing custom field values for the contact
    const existingValues = await prisma.contactCustomFieldValue.findMany({
      where: {
        contactId,
      },
      include: {
        property: true,
      },
    });

    // Create a map of existing values
    const valueMap = new Map(
      existingValues.map(v => [v.propertyId, v.value])
    );

    // Build response with all properties and their values (or defaults)
    const customFields = customProperties.map(property => ({
      id: property.id,
      name: property.name,
      fieldKey: property.fieldKey,
      fieldType: property.fieldType,
      isRequired: property.isRequired,
      defaultValue: property.defaultValue,
      options: property.options,
      value: valueMap.has(property.id) 
        ? parseStoredValue(valueMap.get(property.id), property.fieldType)
        : (property.defaultValue ? parseStoredValue(property.defaultValue, property.fieldType) : null),
      rawValue: valueMap.get(property.id) || property.defaultValue || '',
    }));

    res.json(customFields);
  } catch (error) {
    console.error('Error fetching contact custom fields:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/contacts/:id/custom-fields - Update custom field values for a contact
router.put('/:contactId/custom-fields', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contactId = req.params.contactId;
    const customFieldData = req.body;

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId,
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get all custom properties for the user
    const customProperties = await prisma.customPropertyDefinition.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const propertyMap = new Map(
      customProperties.map(p => [p.fieldKey, p])
    );

    // Validate required fields
    const missingRequired = [];
    for (const property of customProperties) {
      if (property.isRequired && (!customFieldData[property.fieldKey] || customFieldData[property.fieldKey] === '')) {
        missingRequired.push(property.name);
      }
    }

    if (missingRequired.length > 0) {
      return res.status(400).json({ 
        error: 'Required fields missing', 
        missingFields: missingRequired 
      });
    }

    // Process each field value
    const updates = [];
    for (const [fieldKey, value] of Object.entries(customFieldData)) {
      const property = propertyMap.get(fieldKey);
      if (!property) {
        continue; // Skip unknown fields
      }

      const parsedValue = parseFieldValue(value, property.fieldType);
      
      updates.push({
        contactId,
        propertyId: property.id,
        value: parsedValue,
      });
    }

    // Use transaction to update all values
    await prisma.$transaction(async (tx) => {
      // Delete existing values for this contact
      await tx.contactCustomFieldValue.deleteMany({
        where: {
          contactId,
          propertyId: {
            in: updates.map(u => u.propertyId),
          },
        },
      });

      // Create new values (only for non-empty values)
      const nonEmptyUpdates = updates.filter(u => u.value !== '');
      if (nonEmptyUpdates.length > 0) {
        await tx.contactCustomFieldValue.createMany({
          data: nonEmptyUpdates,
        });
      }
    });

    // Return updated custom fields
    const updatedFields = await prisma.contactCustomFieldValue.findMany({
      where: {
        contactId,
      },
      include: {
        property: {
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    const response = updatedFields.map(field => ({
      id: field.property.id,
      name: field.property.name,
      fieldKey: field.property.fieldKey,
      fieldType: field.property.fieldType,
      value: parseStoredValue(field.value, field.property.fieldType),
      rawValue: field.value,
      options: field.property.options,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error updating contact custom fields:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/contacts/:id/custom-fields/:fieldKey - Get specific custom field value
router.get('/:contactId/custom-fields/:fieldKey', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contactId = req.params.contactId;
    const fieldKey = req.params.fieldKey;

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId,
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get the custom property
    const property = await prisma.customPropertyDefinition.findUnique({
      where: {
        userId_fieldKey: {
          userId,
          fieldKey,
        },
      },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Custom property not found' });
    }

    // Get the field value
    const fieldValue = await prisma.contactCustomFieldValue.findUnique({
      where: {
        contactId_propertyId: {
          contactId,
          propertyId: property.id,
        },
      },
    });

    const value = fieldValue 
      ? parseStoredValue(fieldValue.value, property.fieldType)
      : (property.defaultValue ? parseStoredValue(property.defaultValue, property.fieldType) : null);

    res.json({
      id: property.id,
      name: property.name,
      fieldKey: property.fieldKey,
      fieldType: property.fieldType,
      isRequired: property.isRequired,
      defaultValue: property.defaultValue,
      options: property.options,
      value,
      rawValue: fieldValue?.value || property.defaultValue || '',
    });
  } catch (error) {
    console.error('Error fetching contact custom field:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;