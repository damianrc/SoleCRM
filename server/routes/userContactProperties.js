import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user's contact property options (compatibility endpoint)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get custom properties from the new system
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

    // Convert to old format for backward compatibility
    const typeProperty = customProperties.find(p => p.fieldKey === 'contact_type');
    const sourceProperty = customProperties.find(p => p.fieldKey === 'lead_source');
    const statusProperty = customProperties.find(p => p.fieldKey === 'status');

    const props = {
      typeOptions: typeProperty ? typeProperty.options.map(opt => opt.label) : ['Lead', 'Prospect', 'Customer', 'Partner'],
      sourceOptions: sourceProperty ? sourceProperty.options.map(opt => opt.label) : ['Website', 'Referral', 'Social Media', 'Cold Outreach', 'Advertisement'],
      statusOptions: statusProperty ? statusProperty.options.map(opt => opt.label) : ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost']
    };

    res.json(props);
  } catch (error) {
    console.error('Error fetching contact property options:', error);
    res.status(500).json({ error: 'Failed to fetch contact property options' });
  }
});

// Update current user's contact property options (compatibility endpoint)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { typeOptions, sourceOptions, statusOptions } = req.body;
    
    if (!Array.isArray(typeOptions) || !Array.isArray(sourceOptions) || !Array.isArray(statusOptions)) {
      return res.status(400).json({ error: 'All options must be arrays' });
    }

    // Update the custom properties in the new system
    const propertyUpdates = [
      { fieldKey: 'contact_type', options: typeOptions },
      { fieldKey: 'lead_source', options: sourceOptions },
      { fieldKey: 'status', options: statusOptions }
    ];

    for (const update of propertyUpdates) {
      // Find the property
      const property = await prisma.customPropertyDefinition.findUnique({
        where: {
          userId_fieldKey: {
            userId,
            fieldKey: update.fieldKey
          }
        }
      });

      if (property) {
        // Delete existing options
        await prisma.customPropertyOption.deleteMany({
          where: { propertyId: property.id }
        });

        // Create new options
        const optionsData = update.options.map((label, index) => ({
          propertyId: property.id,
          label,
          value: label.toLowerCase().replace(/\s+/g, '_'),
          sortOrder: index + 1
        }));

        if (optionsData.length > 0) {
          await prisma.customPropertyOption.createMany({
            data: optionsData
          });
        }
      }
    }

    // Return the updated data in the old format
    const updated = {
      typeOptions,
      sourceOptions,
      statusOptions
    };

    res.json(updated);
  } catch (error) {
    console.error('Error updating contact property options:', error);
    res.status(500).json({ error: 'Failed to update contact property options' });
  }
});

export default router;
