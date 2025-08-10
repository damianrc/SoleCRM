import { PrismaClient, CustomFieldType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CustomPropertyWithOptions {
  id: string;
  name: string;
  fieldKey: string;
  fieldType: CustomFieldType;
  isRequired: boolean;
  defaultValue: string | null;
  sortOrder: number;
  options: Array<{
    id: string;
    label: string;
    value: string;
    sortOrder: number;
  }>;
}

export interface ContactWithCustomFields {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
  customFields: Record<string, any>;
}

/**
 * Get all custom properties for a user with their options
 */
export async function getUserCustomProperties(userId: string): Promise<CustomPropertyWithOptions[]> {
  return await prisma.customPropertyDefinition.findMany({
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
}

/**
 * Get contacts with their custom field values formatted for easy use
 */
export async function getContactsWithCustomFields(
  userId: string,
  filters?: {
    search?: string;
    customFieldFilters?: Record<string, any>;
    limit?: number;
    offset?: number;
  }
): Promise<ContactWithCustomFields[]> {
  const { search, customFieldFilters, limit, offset } = filters || {};

  // Build where clause
  const whereClause: any = {
    userId,
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get contacts with custom field values
  const contacts = await prisma.contact.findMany({
    where: whereClause,
    include: {
      customFieldValues: {
        include: {
          property: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  // Format the response
  const formattedContacts: ContactWithCustomFields[] = contacts.map(contact => {
    const customFields: Record<string, any> = {};
    
    contact.customFieldValues.forEach(fieldValue => {
      const property = fieldValue.property;
      customFields[property.fieldKey] = parseStoredValue(fieldValue.value, property.fieldType);
    });

    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      customFields,
    };
  });

  // Apply custom field filters if provided
  if (customFieldFilters) {
    return formattedContacts.filter(contact => {
      return Object.entries(customFieldFilters).every(([fieldKey, filterValue]) => {
        const contactValue = contact.customFields[fieldKey];
        
        if (filterValue === null || filterValue === undefined) {
          return true; // No filter applied
        }

        if (Array.isArray(filterValue)) {
          // Multiple values filter (OR condition)
          return filterValue.includes(contactValue);
        }

        if (typeof filterValue === 'string' && filterValue.includes('*')) {
          // Wildcard search
          const regex = new RegExp(filterValue.replace(/\*/g, '.*'), 'i');
          return regex.test(String(contactValue || ''));
        }

        return contactValue === filterValue;
      });
    });
  }

  return formattedContacts;
}

/**
 * Create default custom properties for a new user
 */
export async function createDefaultCustomProperties(userId: string): Promise<void> {
  const defaultProperties = [
    {
      name: 'Contact Type',
      fieldKey: 'contact_type',
      fieldType: 'DROPDOWN' as CustomFieldType,
      sortOrder: 1,
      options: [
        { label: 'Lead', value: 'lead', sortOrder: 1 },
        { label: 'Prospect', value: 'prospect', sortOrder: 2 },
        { label: 'Customer', value: 'customer', sortOrder: 3 },
        { label: 'Partner', value: 'partner', sortOrder: 4 },
      ],
    },
    {
      name: 'Lead Source',
      fieldKey: 'lead_source',
      fieldType: 'DROPDOWN' as CustomFieldType,
      sortOrder: 2,
      options: [
        { label: 'Website', value: 'website', sortOrder: 1 },
        { label: 'Referral', value: 'referral', sortOrder: 2 },
        { label: 'Social Media', value: 'social_media', sortOrder: 3 },
        { label: 'Cold Outreach', value: 'cold_outreach', sortOrder: 4 },
        { label: 'Advertisement', value: 'advertisement', sortOrder: 5 },
      ],
    },
    {
      name: 'Status',
      fieldKey: 'status',
      fieldType: 'DROPDOWN' as CustomFieldType,
      sortOrder: 3,
      options: [
        { label: 'New', value: 'new', sortOrder: 1 },
        { label: 'Contacted', value: 'contacted', sortOrder: 2 },
        { label: 'Qualified', value: 'qualified', sortOrder: 3 },
        { label: 'Proposal Sent', value: 'proposal_sent', sortOrder: 4 },
        { label: 'Negotiating', value: 'negotiating', sortOrder: 5 },
        { label: 'Closed Won', value: 'closed_won', sortOrder: 6 },
        { label: 'Closed Lost', value: 'closed_lost', sortOrder: 7 },
      ],
    },
    {
      name: 'Company',
      fieldKey: 'company',
      fieldType: 'TEXT' as CustomFieldType,
      sortOrder: 4,
      options: [],
    },
    {
      name: 'Job Title',
      fieldKey: 'job_title',
      fieldType: 'TEXT' as CustomFieldType,
      sortOrder: 5,
      options: [],
    },
  ];

  for (const propDef of defaultProperties) {
    const property = await prisma.customPropertyDefinition.create({
      data: {
        userId,
        name: propDef.name,
        fieldKey: propDef.fieldKey,
        fieldType: propDef.fieldType,
        sortOrder: propDef.sortOrder,
      },
    });

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
}

/**
 * Validate custom field values against property definitions
 */
export async function validateCustomFieldValues(
  userId: string,
  fieldValues: Record<string, any>
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Get all custom properties for the user
  const properties = await getUserCustomProperties(userId);
  const propertyMap = new Map(properties.map(p => [p.fieldKey, p]));

  // Check required fields
  for (const property of properties) {
    if (property.isRequired) {
      const value = fieldValues[property.fieldKey];
      if (value === null || value === undefined || value === '') {
        errors.push(`${property.name} is required`);
      }
    }
  }

  // Validate field types and values
  for (const [fieldKey, value] of Object.entries(fieldValues)) {
    const property = propertyMap.get(fieldKey);
    if (!property) {
      continue; // Skip unknown fields
    }

    const validationError = validateFieldValue(value, property);
    if (validationError) {
      errors.push(`${property.name}: ${validationError}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single field value against its property definition
 */
function validateFieldValue(value: any, property: CustomPropertyWithOptions): string | null {
  if (value === null || value === undefined || value === '') {
    return null; // Empty values are handled by required field validation
  }

  switch (property.fieldType) {
    case 'EMAIL':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return 'Invalid email format';
      }
      break;

    case 'PHONE':
      const phoneRegex = /^[\d+\-() ]+$/;
      if (!phoneRegex.test(String(value))) {
        return 'Invalid phone format';
      }
      break;

    case 'NUMBER':
      if (isNaN(Number(value))) {
        return 'Must be a valid number';
      }
      break;

    case 'URL':
      try {
        new URL(String(value));
      } catch {
        return 'Invalid URL format';
      }
      break;

    case 'DATE':
    case 'DATETIME':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format';
      }
      break;

    case 'DROPDOWN':
      const validOptions = property.options.map(opt => opt.value);
      if (!validOptions.includes(String(value))) {
        return `Must be one of: ${validOptions.join(', ')}`;
      }
      break;

    case 'MULTISELECT':
      if (!Array.isArray(value)) {
        return 'Must be an array of values';
      }
      const validMultiOptions = property.options.map(opt => opt.value);
      const invalidOptions = value.filter(v => !validMultiOptions.includes(String(v)));
      if (invalidOptions.length > 0) {
        return `Invalid options: ${invalidOptions.join(', ')}`;
      }
      break;

    case 'BOOLEAN':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return 'Must be true or false';
      }
      break;
  }

  return null;
}

/**
 * Parse stored value for display based on field type
 */
export function parseStoredValue(value: string, fieldType: CustomFieldType): any {
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
}

/**
 * Format field value for storage based on field type
 */
export function formatValueForStorage(value: any, fieldType: CustomFieldType): string {
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value) ? value : '';
    case 'PHONE':
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
}