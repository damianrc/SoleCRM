import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCustomProperties() {
  try {
    const userId = '9942234405';
    
    console.log('=== Checking Custom Properties ===');
    const customProperties = await prisma.customPropertyDefinition.findMany({
      where: { userId },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    
    console.log('Custom properties found:', customProperties.length);
    customProperties.forEach(prop => {
      console.log(`- ${prop.name} (${prop.fieldKey}): ${prop.fieldType}`);
      if (prop.options.length > 0) {
        prop.options.forEach(opt => {
          console.log(`  * ${opt.label} (${opt.value})`);
        });
      }
    });
    
    console.log('\n=== Checking Contact Custom Field Values ===');
    const contactId = 'CNT8352823';
    const customFieldValues = await prisma.contactCustomFieldValue.findMany({
      where: { contactId },
      include: {
        property: true
      }
    });
    
    console.log('Custom field values found:', customFieldValues.length);
    customFieldValues.forEach(value => {
      console.log(`- ${value.property.fieldKey}: ${value.value}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCustomProperties();