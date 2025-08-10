import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugContactFetch() {
  try {
    const userId = '9942234405';
    
    console.log('=== Checking Contact Fetch ===');
    
    // Simulate the GET /api/contacts query
    const contacts = await prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5, // Just get first 5 for testing
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        customFieldValues: {
          select: {
            value: true,
            property: {
              select: {
                fieldKey: true,
                fieldType: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log('Raw contacts from database:');
    contacts.forEach(contact => {
      console.log(`\n--- Contact: ${contact.name} (${contact.id}) ---`);
      console.log('Custom field values:');
      contact.customFieldValues.forEach(fieldValue => {
        console.log(`  - ${fieldValue.property.fieldKey}: ${fieldValue.value}`);
      });
    });
    
    // Format contacts with custom fields (like the API does)
    const formattedContacts = contacts.map(contact => {
      const customFields = {};
      contact.customFieldValues.forEach(fieldValue => {
        const property = fieldValue.property;
        let value = fieldValue.value;
        
        // Parse value based on field type
        switch (property.fieldType) {
          case 'NUMBER':
            value = parseFloat(value) || 0;
            break;
          case 'BOOLEAN':
            value = value === 'true';
            break;
          case 'DATE':
          case 'DATETIME':
            value = value ? new Date(value) : null;
            break;
          case 'MULTISELECT':
            try {
              value = JSON.parse(value);
            } catch {
              value = [];
            }
            break;
        }
        
        customFields[property.fieldKey] = value;
      });
      
      return {
        ...contact,
        customFields,
        // Remove the raw customFieldValues from response
        customFieldValues: undefined
      };
    });
    
    console.log('\n=== Formatted contacts (API response format) ===');
    formattedContacts.forEach(contact => {
      console.log(`\n--- Contact: ${contact.name} (${contact.id}) ---`);
      console.log('Custom fields:', contact.customFields);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugContactFetch();