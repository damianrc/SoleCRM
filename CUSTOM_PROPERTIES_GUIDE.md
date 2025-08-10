# Custom Properties System Guide

This guide explains how to implement and use the new flexible custom properties system in SoleCRM.

## Overview

The custom properties system allows users to define their own contact fields without requiring code changes. Each user can create custom properties with different types, validation rules, and dropdown options.

## Database Schema

### Core Models

1. **CustomPropertyDefinition** - Defines what custom properties are available for a user
2. **CustomPropertyOption** - Options for dropdown/multiselect properties
3. **ContactCustomFieldValue** - Stores actual custom field values for contacts

### Key Features

- **User-specific**: Each user can define their own custom properties
- **Type-safe**: Support for various field types with validation
- **Flexible**: Dropdown/multiselect with custom options
- **Performance**: Proper indexing for efficient queries
- **Soft deletes**: Properties can be deactivated without losing data

## Migration Steps

### 1. Run Database Migration

```bash
cd server
npx prisma migrate dev --name "add_custom_properties_system"
```

### 2. Migrate Existing Data

```bash
# Run the migration script to convert existing data
npx ts-node prisma/migrate-to-custom-properties.ts
```

This script will:
- Create default custom properties for each user
- Migrate existing `contactType`, `leadSource`, `status`, and `suburb` data
- Create corresponding custom field values

### 3. Update API Routes

Add the new routes to your Express app:

```typescript
// In your main app.ts or routes file
import customPropertiesRouter from './routes/custom-properties';
import contactCustomFieldsRouter from './routes/contact-custom-fields';

app.use('/api/custom-properties', customPropertiesRouter);
app.use('/api/contacts', contactCustomFieldsRouter);
```

## API Endpoints

### Custom Properties Management

```typescript
// Get all custom properties for user
GET /api/custom-properties

// Create new custom property
POST /api/custom-properties
{
  "name": "Lead Source",
  "fieldKey": "lead_source",
  "fieldType": "DROPDOWN",
  "isRequired": false,
  "sortOrder": 1
}

// Update custom property
PUT /api/custom-properties/:id
{
  "name": "Updated Name",
  "isRequired": true
}

// Delete custom property (soft delete)
DELETE /api/custom-properties/:id

// Add option to dropdown/multiselect
POST /api/custom-properties/:id/options
{
  "label": "Website",
  "value": "website",
  "sortOrder": 1
}

// Update option
PUT /api/custom-properties/:id/options/:optionId
{
  "label": "Updated Label"
}

// Delete option (soft delete)
DELETE /api/custom-properties/:id/options/:optionId
```

### Contact Custom Fields

```typescript
// Get all custom field values for a contact
GET /api/contacts/:id/custom-fields

// Update custom field values for a contact
PUT /api/contacts/:id/custom-fields
{
  "lead_source": "website",
  "contact_type": "lead",
  "status": "new",
  "company": "Acme Corp"
}

// Get specific custom field value
GET /api/contacts/:id/custom-fields/:fieldKey
```

## Field Types

### Supported Types

1. **TEXT** - Single line text input
2. **TEXTAREA** - Multi-line text input
3. **NUMBER** - Numeric input with validation
4. **EMAIL** - Email input with validation
5. **PHONE** - Phone number input
6. **URL** - URL input with validation
7. **DATE** - Date picker
8. **DATETIME** - Date and time picker
9. **BOOLEAN** - Checkbox (true/false)
10. **DROPDOWN** - Single selection from predefined options
11. **MULTISELECT** - Multiple selections from predefined options

### Type-Specific Validation

```typescript
// Example validation logic
const validateFieldValue = (value: any, fieldType: string) => {
  switch (fieldType) {
    case 'EMAIL':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'PHONE':
      return /^[\d+\-() ]+$/.test(value);
    case 'NUMBER':
      return !isNaN(Number(value));
    case 'URL':
      try { new URL(value); return true; } catch { return false; }
    // ... other validations
  }
};
```

## Frontend Implementation

### 1. Settings Page for Custom Properties

Create a settings page where users can manage their custom properties:

```typescript
// Example React component structure
const CustomPropertiesSettings = () => {
  const [properties, setProperties] = useState([]);
  
  const createProperty = async (propertyData) => {
    const response = await fetch('/api/custom-properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyData)
    });
    // Handle response
  };
  
  const updateProperty = async (id, updates) => {
    const response = await fetch(`/api/custom-properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    // Handle response
  };
  
  // Render property management UI
};
```

### 2. Dynamic Contact Form

Create a dynamic form that renders fields based on custom properties:

```typescript
const ContactForm = ({ contactId }) => {
  const [customProperties, setCustomProperties] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  
  useEffect(() => {
    // Fetch custom properties
    fetchCustomProperties();
    if (contactId) {
      fetchContactCustomFields(contactId);
    }
  }, [contactId]);
  
  const renderField = (property) => {
    switch (property.fieldType) {
      case 'TEXT':
        return <input type="text" {...fieldProps} />;
      case 'DROPDOWN':
        return (
          <select {...fieldProps}>
            {property.options.map(option => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'MULTISELECT':
        return (
          <MultiSelect
            options={property.options}
            value={fieldValues[property.fieldKey] || []}
            onChange={(values) => updateFieldValue(property.fieldKey, values)}
          />
        );
      // ... other field types
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Core fields */}
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" />
      <input name="phone" placeholder="Phone" />
      
      {/* Dynamic custom fields */}
      {customProperties.map(property => (
        <div key={property.id}>
          <label>
            {property.name}
            {property.isRequired && <span>*</span>}
          </label>
          {renderField(property)}
        </div>
      ))}
      
      <button type="submit">Save Contact</button>
    </form>
  );
};
```

### 3. Contact List with Custom Columns

Extend your contact list to show custom properties as columns:

```typescript
const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [customProperties, setCustomProperties] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  
  const fetchContactsWithCustomFields = async () => {
    const response = await fetch('/api/contacts?includeCustomFields=true');
    const data = await response.json();
    setContacts(data);
  };
  
  return (
    <div>
      {/* Column visibility controls */}
      <div className="column-controls">
        {customProperties.map(property => (
          <label key={property.id}>
            <input
              type="checkbox"
              checked={visibleColumns.includes(property.fieldKey)}
              onChange={(e) => toggleColumn(property.fieldKey, e.target.checked)}
            />
            {property.name}
          </label>
        ))}
      </div>
      
      {/* Contact table */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            {visibleColumns.map(fieldKey => {
              const property = customProperties.find(p => p.fieldKey === fieldKey);
              return <th key={fieldKey}>{property?.name}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {contacts.map(contact => (
            <tr key={contact.id}>
              <td>{contact.name}</td>
              <td>{contact.email}</td>
              <td>{contact.phone}</td>
              {visibleColumns.map(fieldKey => (
                <td key={fieldKey}>
                  {formatCustomFieldValue(
                    contact.customFields[fieldKey],
                    customProperties.find(p => p.fieldKey === fieldKey)?.fieldType
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## Utility Functions

### Working with Custom Properties

```typescript
import { 
  getUserCustomProperties,
  getContactsWithCustomFields,
  validateCustomFieldValues,
  parseStoredValue,
  formatValueForStorage
} from './utils/custom-properties';

// Get all custom properties for a user
const properties = await getUserCustomProperties(userId);

// Get contacts with formatted custom fields
const contacts = await getContactsWithCustomFields(userId, {
  search: 'john',
  customFieldFilters: {
    contact_type: 'lead',
    status: ['new', 'contacted']
  },
  limit: 50,
  offset: 0
});

// Validate custom field values before saving
const validation = await validateCustomFieldValues(userId, {
  lead_source: 'website',
  contact_type: 'lead',
  email_custom: 'invalid-email' // This will fail validation
});

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

## Performance Considerations

### Database Indexes

The schema includes optimized indexes for:
- User-specific property lookups
- Contact custom field queries
- Sorting and filtering operations

### Query Optimization

```typescript
// Efficient query to get contacts with custom fields
const contacts = await prisma.contact.findMany({
  where: { userId },
  include: {
    customFieldValues: {
      include: {
        property: {
          include: {
            options: true
          }
        }
      }
    }
  }
});
```

### Caching Strategy

Consider implementing caching for:
- Custom property definitions (rarely change)
- Property options (rarely change)
- Frequently accessed contact data

## Best Practices

### 1. Field Key Naming

- Use snake_case for field keys
- Keep keys short but descriptive
- Avoid special characters except underscores

### 2. Property Management

- Soft delete properties to preserve historical data
- Use sortOrder for consistent UI ordering
- Validate field keys for uniqueness per user

### 3. Data Migration

- Always backup data before migration
- Test migration scripts on development data first
- Provide rollback procedures

### 4. Frontend UX

- Show loading states during property operations
- Provide clear validation error messages
- Allow users to reorder properties via drag-and-drop
- Implement bulk operations for efficiency

## Troubleshooting

### Common Issues

1. **Migration fails**: Check for existing data conflicts
2. **Validation errors**: Ensure field types match expected formats
3. **Performance issues**: Review query patterns and indexing
4. **UI not updating**: Check state management and re-rendering logic

### Debug Queries

```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Check custom property creation
const property = await prisma.customPropertyDefinition.findUnique({
  where: { userId_fieldKey: { userId, fieldKey: 'test_field' } },
  include: { options: true, fieldValues: true }
});
```

This custom properties system provides a flexible, scalable solution for dynamic contact fields while maintaining type safety and performance.