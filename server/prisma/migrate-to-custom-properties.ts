import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToCustomProperties() {
  console.log('Starting migration to custom properties system...');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        contacts: true,
      },
    });

    for (const user of users) {
      console.log(`Processing user: ${user.email}`);

      // Create default custom property definitions for each user
      const defaultProperties = [
        {
          name: 'Contact Type',
          fieldKey: 'contact_type',
          fieldType: 'DROPDOWN' as const,
          isRequired: false,
          sortOrder: 1,
          options: [
            { label: 'Buyer', value: 'BUYER', sortOrder: 1 },
            { label: 'Seller', value: 'SELLER', sortOrder: 2 },
            { label: 'Past Client', value: 'PAST_CLIENT', sortOrder: 3 },
            { label: 'Lead', value: 'LEAD', sortOrder: 4 },
          ],
        },
        {
          name: 'Lead Source',
          fieldKey: 'lead_source',
          fieldType: 'DROPDOWN' as const,
          isRequired: false,
          sortOrder: 2,
          options: [
            { label: 'Website', value: 'website', sortOrder: 1 },
            { label: 'Referral', value: 'referral', sortOrder: 2 },
            { label: 'Social Media', value: 'social_media', sortOrder: 3 },
            { label: 'Cold Call', value: 'cold_call', sortOrder: 4 },
            { label: 'Advertisement', value: 'advertisement', sortOrder: 5 },
          ],
        },
        {
          name: 'Status',
          fieldKey: 'status',
          fieldType: 'DROPDOWN' as const,
          isRequired: false,
          sortOrder: 3,
          options: [
            { label: 'New', value: 'NEW', sortOrder: 1 },
            { label: 'Contacted', value: 'CONTACTED', sortOrder: 2 },
            { label: 'Qualified', value: 'QUALIFIED', sortOrder: 3 },
            { label: 'Proposal', value: 'PROPOSAL', sortOrder: 4 },
            { label: 'Negotiation', value: 'NEGOTIATION', sortOrder: 5 },
            { label: 'Closed Won', value: 'CLOSED_WON', sortOrder: 6 },
            { label: 'Closed Lost', value: 'CLOSED_LOST', sortOrder: 7 },
          ],
        },
        {
          name: 'Suburb',
          fieldKey: 'suburb',
          fieldType: 'TEXT' as const,
          isRequired: false,
          sortOrder: 4,
          options: [],
        },
      ];

      // Create custom property definitions
      const createdProperties: { [key: string]: string } = {};
      
      for (const propDef of defaultProperties) {
        const property = await prisma.customPropertyDefinition.create({
          data: {
            userId: user.id,
            name: propDef.name,
            fieldKey: propDef.fieldKey,
            fieldType: propDef.fieldType,
            isRequired: propDef.isRequired,
            sortOrder: propDef.sortOrder,
          },
        });

        createdProperties[propDef.fieldKey] = property.id;

        // Create options for dropdown properties
        for (const option of propDef.options) {
          await prisma.customPropertyOption.create({
            data: {
              propertyId: property.id,
              label: option.label,
              value: option.value,
              sortOrder: option.sortOrder,
            },
          });
        }
      }

      // Migrate existing contact data to custom field values
      for (const contact of user.contacts) {
        const customFieldValues = [];

        // Migrate contactType if it exists
        if ((contact as any).contactType) {
          customFieldValues.push({
            contactId: contact.id,
            propertyId: createdProperties['contact_type'],
            value: (contact as any).contactType,
          });
        }

        // Migrate leadSource if it exists
        if ((contact as any).leadSource) {
          customFieldValues.push({
            contactId: contact.id,
            propertyId: createdProperties['lead_source'],
            value: (contact as any).leadSource,
          });
        }

        // Migrate status if it exists
        if ((contact as any).status) {
          customFieldValues.push({
            contactId: contact.id,
            propertyId: createdProperties['status'],
            value: (contact as any).status,
          });
        }

        // Migrate suburb if it exists
        if ((contact as any).suburb) {
          customFieldValues.push({
            contactId: contact.id,
            propertyId: createdProperties['suburb'],
            value: (contact as any).suburb,
          });
        }

        // Create custom field values
        for (const fieldValue of customFieldValues) {
          await prisma.contactCustomFieldValue.create({
            data: fieldValue,
          });
        }
      }

      console.log(`✅ Migrated ${user.contacts.length} contacts for user ${user.email}`);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateToCustomProperties()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateToCustomProperties };