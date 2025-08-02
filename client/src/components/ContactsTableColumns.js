import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Eye, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';

const columnHelper = createColumnHelper();

// Memoized cell components for better performance
const SelectionCell = React.memo(({ row }) => (
  <input
    type="checkbox"
    className="table-checkbox"
    checked={row.getIsSelected()}
    disabled={!row.getCanSelect()}
    onChange={row.getToggleSelectedHandler()}
    aria-label={`Select ${row.original.name}`}
  />
));

const SelectionHeader = React.memo(({ table }) => (
  <input
    type="checkbox"
    className="table-checkbox"
    checked={table.getIsAllRowsSelected()}
    ref={(el) => {
      if (el) el.indeterminate = table.getIsSomeRowsSelected();
    }}
    onChange={table.getToggleAllRowsSelectedHandler()}
    aria-label="Select all contacts"
  />
));

const ContactAvatar = React.memo(({ name }) => {
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const initials = getInitials(name);
  
  return (
    <div className="contact-avatar" title={name}>
      {initials}
    </div>
  );
});

const NameCell = React.memo(({ getValue, row, onViewContact }) => {
  const name = getValue();
  const contact = row.original;
  
  return (
    <div className="contact-name-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div className="name-cell" style={{ flex: 1 }}>
        <span className="contact-name" title={name} style={{ fontSize: '14px' }}>
          {name || 'Unnamed Contact'}
        </span>
      </div>
      <button
        className="view-contact-btn"
        onClick={() => onViewContact(contact)}
        aria-label={`View ${name}`}
        title="View contact details"
        style={{ 
          fontSize: '14px',
          marginLeft: '8px',
          padding: '12px 20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          minWidth: '120px',
          textAlign: 'center',
          color: '#000000'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#e9ecef';
          e.target.style.borderColor = '#6c757d';
          e.target.style.color = '#000000';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.borderColor = '#dee2e6';
          e.target.style.color = '#000000';
        }}
      >
        View Contact
      </button>
    </div>
  );
});

const StatusCell = React.memo(({ getValue }) => {
  const status = getValue();
  const getStatusClass = (status) => {
    if (!status) return 'unknown';
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'new':
      case 'active':
        return 'new';
      case 'lead':
      case 'prospect':
        return 'lead';
      case 'warm':
      case 'interested':
        return 'warm';
      case 'cold':
      case 'inactive':
        return 'cold';
      default:
        return 'lead';
    }
  };

  const statusClass = getStatusClass(status);
  
  return (
    <span 
      className={`status-badge ${statusClass}`}
      title={status}
      style={{ fontSize: '14px' }}
    >
      {status || 'No Status'}
    </span>
  );
});

const ContactTypeCell = React.memo(({ getValue }) => {
  const type = getValue();
  const typeLabels = {
    BUYER: 'Buyer',
    SELLER: 'Seller',
    LEAD: 'Lead',
    PAST_CLIENT: 'Past Client'
  };
  
  return (
    <span 
      className={`contact-type-badge type-${type?.toLowerCase() || 'unknown'}`}
      title={type}
      style={{ fontSize: '14px' }}
    >
      {typeLabels[type] || type || 'Unknown'}
    </span>
  );
});

const EmailCell = React.memo(({ getValue }) => {
  const email = getValue();
  if (!email) return <span className="text-muted" style={{ fontSize: '14px' }}>No email</span>;
  
  return (
    <a href={`mailto:${email}`} className="email-link" title={email} style={{ fontSize: '14px' }}>
      {email}
    </a>
  );
});

const PhoneCell = React.memo(({ getValue }) => {
  const phone = getValue();
  if (!phone) return <span className="text-muted" style={{ fontSize: '14px' }}>No phone</span>;
  
  return (
    <a href={`tel:${phone}`} className="phone-link" title={phone} style={{ fontSize: '14px' }}>
      {phone}
    </a>
  );
});

const AddressCell = React.memo(({ row }) => {
  const { address, suburb } = row.original;
  if (!address && !suburb) return <span className="text-muted" style={{ fontSize: '14px' }}>No address</span>;
  
  const fullAddress = [address, suburb].filter(Boolean).join(', ');
  
  return (
    <span className="address-text" title={fullAddress} style={{ fontSize: '14px' }}>
      {fullAddress}
    </span>
  );
});

const ActionsCell = React.memo(({ row, onViewContact, onEditContact, onDeleteContact }) => {
  const contact = row.original;
  
  return (
    <div className="actions-cell">
      <button
        className="action-btn view-btn"
        onClick={() => onViewContact(contact)}
        aria-label="View contact"
        title="View contact"
      >
        <Eye size={14} />
      </button>
      <button
        className="action-btn edit-btn"
        onClick={() => onEditContact(contact)}
        aria-label="Edit contact"
        title="Edit contact"
      >
        <Edit size={14} />
      </button>
      <button
        className="action-btn delete-btn"
        onClick={() => onDeleteContact(contact.id)}
        aria-label="Delete contact"
        title="Delete contact"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
});

// Export optimized column definitions
export const createContactsColumns = ({
  onViewContact,
  onEditContact,
  onDeleteContact,
  visibleColumns = {}
}) => {
  const columns = [
    // Selection column - not movable, not resizable
    {
      id: 'select',
      header: ({ table }) => <SelectionHeader table={table} />,
      cell: ({ row }) => <SelectionCell row={row} />,
      size: 50,
      minSize: 50,
      maxSize: 50,
      enableResizing: false,
      enableSorting: false,
      enableColumnFilter: false,
      enableReordering: false, // Cannot be moved
    },
    
    // Name column - not movable but resizable
    columnHelper.accessor('name', {
      id: 'name',
      header: 'Name',
      cell: ({ getValue, row }) => (
        <NameCell 
          getValue={getValue} 
          row={row} 
          onViewContact={onViewContact} 
        />
      ),
      size: 300,
      minSize: 250,
      maxSize: 450,
      enableSorting: true,
      enableResizing: true,
      enableReordering: false, // Cannot be moved
      sortingFn: 'alphanumeric',
      filterFn: 'includesString',
    }),
    
    // Status column - movable and resizable
    columnHelper.accessor('status', {
      id: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusCell getValue={getValue} />,
      size: 120,
      minSize: 100,
      maxSize: 150,
      enableSorting: true,
      enableResizing: true,
      enableReordering: true, // Can be moved
      filterFn: 'equals',
      meta: {
        filterVariant: 'select',
      },
    }),
    
    // Contact Type column - movable and resizable
    columnHelper.accessor('contactType', {
      id: 'contactType',
      header: 'Type',
      cell: ({ getValue }) => <ContactTypeCell getValue={getValue} />,
      size: 100,
      minSize: 80,
      maxSize: 120,
      enableSorting: true,
      enableResizing: true,
      enableReordering: true, // Can be moved
      filterFn: 'equals',
      meta: {
        filterVariant: 'select',
      },
    }),
    
    // Email column - movable and resizable
    columnHelper.accessor('email', {
      id: 'email',
      header: 'Email',
      cell: ({ getValue }) => <EmailCell getValue={getValue} />,
      size: 200,
      minSize: 150,
      maxSize: 300,
      enableSorting: true,
      enableResizing: true,
      enableReordering: true, // Can be moved
      filterFn: 'includesString',
    }),
    
    // Phone column - movable and resizable
    columnHelper.accessor('phone', {
      id: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => <PhoneCell getValue={getValue} />,
      size: 140,
      minSize: 120,
      maxSize: 180,
      enableSorting: true,
      enableResizing: true,
      enableReordering: true, // Can be moved
      filterFn: 'includesString',
    }),
    
    // Address column - movable and resizable
    {
      id: 'address',
      header: 'Address',
      cell: ({ row }) => <AddressCell row={row} />,
      size: 200,
      minSize: 150,
      maxSize: 300,
      enableSorting: false,
      enableResizing: true,
      enableReordering: true, // Can be moved
      filterFn: (row, columnId, filterValue) => {
        const address = row.original.address || '';
        const suburb = row.original.suburb || '';
        const fullAddress = `${address} ${suburb}`.toLowerCase();
        return fullAddress.includes(filterValue.toLowerCase());
      },
    },
    
    // Lead Source column - movable and resizable
    columnHelper.accessor('leadSource', {
      id: 'leadSource',
      header: 'Lead Source',
      cell: ({ getValue }) => getValue() || <span className="text-muted" style={{ fontSize: '14px' }}>Unknown</span>,
      size: 120,
      minSize: 100,
      maxSize: 180,
      enableSorting: true,
      enableResizing: true,
      enableReordering: true, // Can be moved
      filterFn: 'includesString',
    }),
    
    // Created Date column - movable and resizable
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => {
        const date = getValue();
        if (!date) return <span className="text-muted" style={{ fontSize: '14px' }}>Unknown</span>;
        
        try {
          return <span style={{ fontSize: '14px' }}>{new Date(date).toLocaleDateString()}</span>;
        } catch {
          return <span className="text-muted" style={{ fontSize: '14px' }}>Invalid date</span>;
        }
      },
      size: 100,
      minSize: 80,
      maxSize: 120,
      enableSorting: true,
      enableResizing: true,
      enableReordering: true, // Can be moved
      sortingFn: 'datetime',
    }),
  ];

  // Filter columns based on visibility settings
  return columns.filter(column => {
    if (column.id === 'select' || column.id === 'name') {
      return true; // Always show selection and name
    }
    return visibleColumns[column.id] !== false;
  });
};

// Default column visibility
export const defaultColumnVisibility = {
  select: true,
  name: true,
  status: true,
  contactType: true,
  email: true,
  phone: true,
  address: false, // Hidden by default
  leadSource: false, // Hidden by default
  createdAt: false, // Hidden by default
};

// Column order for persistence
export const columnOrder = [
  'select',
  'name', 
  'status',
  'contactType',
  'email',
  'phone',
  'address',
  'leadSource',
  'createdAt'
];
