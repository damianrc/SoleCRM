import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testContactUpdate() {
  try {
    const userId = '9942234405';
    const contactId = 'CNT8352823';
    
    console.log('=== Before Update ===');
    let contact = await prisma.contact.findFirst({
      where: { id: contactId, userId },
      include: {
        customFieldValues: {
          include: {
            property: true
          }
        }
      }
    });
    
    console.log('Contact:', contact.name);
    console.log('Custom fields:');
    contact.customFieldValues.forEach(value => {
      console.log(`- ${value.property.fieldKey}: ${value.value}`);
    });
    
    console.log('\n=== Simulating Update ===');
    // Simulate the update process
    const updates = { contactType: 'Lead' };
    const allCustomFields = { contact_type: 'Lead' };
    
    // Get custom property definitions
    const customProperties = await prisma.customPropertyDefinition.findMany({
      where: { userId, isActive: true }
    });
    
    const propertyMap = new Map(customProperties.map(p => [p.fieldKey, p]));
    
    // Delete existing custom field values for fields being updated
    const fieldKeysToUpdate = Object.keys(allCustomFields);
    const propertiesToUpdate = fieldKeysToUpdate
      .map(key => propertyMap.get(key))
      .filter(Boolean);
    
    console.log('Properties to update:', propertiesToUpdate.map(p => ({ id: p.id, fieldKey: p.fieldKey })));
    
    if (propertiesToUpdate.length > 0) {
      const deleteResult = await prisma.contactCustomFieldValue.deleteMany({
        where: {
          contactId,
          propertyId: {
            in: propertiesToUpdate.map(p => p.id)
          }
        }
      });
      console.log('Deleted existing values:', deleteResult.count);
      
      // Create new custom field values
      const customFieldValues = [];
      
      for (const [fieldKey, value] of Object.entries(allCustomFields)) {
        const property = propertyMap.get(fieldKey);
        
        if (property && value !== null && value !== undefined && value !== '') {
          let formattedValue = String(value);
          
          customFieldValues.push({
            contactId,
            propertyId: property.id,
            value: formattedValue,
          });
        }
      }
      
      console.log('Custom field values to create:', customFieldValues);
      
      if (customFieldValues.length > 0) {
        const createResult = await prisma.contactCustomFieldValue.createMany({
          data: customFieldValues,
        });
        console.log('Created new values:', createResult.count);
      }
    }
    
    console.log('\n=== After Update ===');
    contact = await prisma.contact.findFirst({
      where: { id: contactId, userId },
      include: {
        customFieldValues: {
          include: {
            property: true
          }
        }
      }
    });
    
    console.log('Contact:', contact.name);
    console.log('Custom fields:');
    contact.customFieldValues.forEach(value => {
      console.log(`- ${value.property.fieldKey}: ${value.value}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContactUpdate();