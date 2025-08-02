import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import '../styles/table-optimized.css';

// Create column helper
const columnHelper = createColumnHelper();

// Header component with resize handle
const HeaderComponent = ({ header }) => {
  const resizeHandler = header.column.getResizeHandler();
  
  return (
    <th
      key={header.id}
      style={{
        width: header.getSize(),
        position: 'relative'
      }}
      className="table-header-cell"
    >
      <div className="header-content">
        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
      </div>
      {header.column.getCanResize() && (
        <div
          onMouseDown={resizeHandler}
          onTouchStart={resizeHandler}
          className="resize-handle"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: '5px',
            cursor: 'col-resize',
            userSelect: 'none',
            touchAction: 'none',
          }}
        />
      )}
    </th>
  );
};

// Default cell component
const DefaultCell = ({ cell }) => {
  return (
    <td
      style={{
        width: cell.column.getSize(),
      }}
      className="table-cell"
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

// Modal component for bulk delete confirmation
const BulkDeleteModal = ({ selectedCount, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete {selectedCount} selected contacts?</p>
      <div className="modal-actions">
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button onClick={onConfirm} className="btn btn-danger">Delete</button>
      </div>
    </div>
  </div>
);

const ContactsList = ({ 
  contacts = [], 
  onContactUpdate, 
  onContactSelect, 
  onBulkDelete,
  onViewContact,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  
  // Refs for virtualization
  const tableContainerRef = useRef(null);
  const outerContainerRef = useRef(null);

  // Create data with proper structure
  const data = useMemo(() => {
    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      suburb: contact.suburb || '',
      contactType: contact.contactType || '',
      leadSource: contact.leadSource || '',
      status: contact.status || ''
    }));
  }, [contacts]);

  // Column definitions with default sizes
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      size: 40,
      enableResizing: false,
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="row-select-all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="row-select"
        />
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      size: 200,
      enableResizing: true,
      cell: ({ getValue, row, table }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(getValue());

        const handleSave = () => {
          if (value !== getValue() && onContactUpdate) {
            onContactUpdate(row.original.id, { name: value });
          }
          setIsEditing(false);
        };

        const handleCancel = () => {
          setValue(getValue());
          setIsEditing(false);
        };

        if (isEditing) {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="inline-edit-input"
              autoFocus
            />
          );
        }

        return (
          <div
            className="name-cell-wrapper"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {value}
          </div>
        );
      }
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      size: 250,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(getValue());

        const handleSave = () => {
          if (value !== getValue() && onContactUpdate) {
            onContactUpdate(row.original.id, { email: value });
          }
          setIsEditing(false);
        };

        const handleCancel = () => {
          setValue(getValue());
          setIsEditing(false);
        };

        if (isEditing) {
          return (
            <input
              type="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="inline-edit-input"
              autoFocus
            />
          );
        }

        return (
          <div
            className="editable-field"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {value}
          </div>
        );
      }
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      size: 150,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(getValue());

        const handleSave = () => {
          if (value !== getValue() && onContactUpdate) {
            onContactUpdate(row.original.id, { phone: value });
          }
          setIsEditing(false);
        };

        const handleCancel = () => {
          setValue(getValue());
          setIsEditing(false);
        };

        if (isEditing) {
          return (
            <input
              type="tel"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="inline-edit-input"
              autoFocus
            />
          );
        }

        return (
          <div
            className="editable-field"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {value}
          </div>
        );
      }
    }),
    columnHelper.accessor('address', {
      header: 'Address',
      size: 300,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(getValue());

        const handleSave = () => {
          if (value !== getValue() && onContactUpdate) {
            onContactUpdate(row.original.id, { address: value });
          }
          setIsEditing(false);
        };

        const handleCancel = () => {
          setValue(getValue());
          setIsEditing(false);
        };

        if (isEditing) {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="inline-edit-input"
              autoFocus
            />
          );
        }

        return (
          <div
            className="editable-field"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {value}
          </div>
        );
      }
    }),
    columnHelper.accessor('suburb', {
      header: 'Suburb',
      size: 150,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(getValue());

        const handleSave = () => {
          if (value !== getValue() && onContactUpdate) {
            onContactUpdate(row.original.id, { suburb: value });
          }
          setIsEditing(false);
        };

        const handleCancel = () => {
          setValue(getValue());
          setIsEditing(false);
        };

        if (isEditing) {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="inline-edit-input"
              autoFocus
            />
          );
        }

        return (
          <div
            className="editable-field"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {value}
          </div>
        );
      }
    }),
    columnHelper.accessor('contactType', {
      header: 'Type',
      size: 150,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(getValue());

        const displayValue = {
          'BUYER': 'Buyer',
          'SELLER': 'Seller', 
          'PAST_CLIENT': 'Past Client',
          'LEAD': 'Lead'
        }[value] || value;

        const handleSave = () => {
          if (value !== getValue() && onContactUpdate) {
            onContactUpdate(row.original.id, { contactType: value });
          }
          setIsEditing(false);
        };

        const handleCancel = () => {
          setValue(getValue());
          setIsEditing(false);
        };

        if (isEditing) {
          return (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancel();
              }}
              className="inline-edit-select"
              autoFocus
            >
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
              <option value="PAST_CLIENT">Past Client</option>
              <option value="LEAD">Lead</option>
            </select>
          );
        }

        return (
          <div
            className="editable-contact-type"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {displayValue}
          </div>
        );
      }
    }),
    columnHelper.accessor('leadSource', {
      header: 'Source',
      size: 150,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(getValue());

        const handleSave = () => {
          if (value !== getValue() && onContactUpdate) {
            onContactUpdate(row.original.id, { leadSource: value });
          }
          setIsEditing(false);
        };

        const handleCancel = () => {
          setValue(getValue());
          setIsEditing(false);
        };

        if (isEditing) {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="inline-edit-input"
              autoFocus
            />
          );
        }

        return (
          <div
            className="editable-field"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {value}
          </div>
        );
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      size: 150,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(getValue());

        const handleSave = () => {
          if (value !== getValue() && onContactUpdate) {
            onContactUpdate(row.original.id, { status: value });
          }
          setIsEditing(false);
        };

        const handleCancel = () => {
          setValue(getValue());
          setIsEditing(false);
        };

        if (isEditing) {
          return (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancel();
              }}
              className="inline-edit-select"
              autoFocus
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Lead">Lead</option>
              <option value="Customer">Customer</option>
            </select>
          );
        }

        return (
          <div
            className="editable-status"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {value}
          </div>
        );
      }
    }),
    columnHelper.display({
      id: 'actions',
      size: 80,
      enableResizing: false,
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => onViewContact && onViewContact(row.original.id)}
          className="btn btn-sm btn-outline-primary view-btn"
        >
          View
        </button>
      ),
    }),
  ], [onContactUpdate, onViewContact]);

  // Create table instance with optimization settings
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Calculate total table width (memoized for performance)
  const totalWidth = useMemo(() => {
    return table.getHeaderGroups()[0]?.headers.reduce((total, header) => {
      return total + header.getSize();
    }, 0) || 0;
  }, [table, table.getState().columnSizing]);

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Sync selectedRows with rowSelection
  useEffect(() => {
    const selectedRowIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    setSelectedRows(selectedRowIds);
  }, [rowSelection]);

  // Bulk delete handlers
  const handleBulkDeleteClick = useCallback(() => {
    setShowBulkDeleteModal(true);
  }, []);

  const handleBulkDeleteConfirm = useCallback(() => {
    if (selectedRows.length > 0 && onBulkDelete) {
      onBulkDelete(selectedRows);
      setSelectedRows([]);
      setRowSelection({});
    }
    setShowBulkDeleteModal(false);
  }, [selectedRows, onBulkDelete]);

  const handleBulkDeleteCancel = useCallback(() => {
    setShowBulkDeleteModal(false);
  }, []);

  // Table props for consistent styling
  const tableProps = {
    style: {
      width: totalWidth,
      tableLayout: 'fixed',
    },
    className: 'optimized-contacts-table'
  };

  return (
    <div className="relative">
      {showBulkDeleteModal && (
        <BulkDeleteModal
          selectedCount={selectedRows.length}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={handleBulkDeleteCancel}
        />
      )}

      {selectedRows.length > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedRows.length} selected</span>
          <button 
            onClick={handleBulkDeleteClick}
            className="btn btn-sm btn-danger"
          >
            Delete Selected
          </button>
        </div>
      )}

      <div 
        ref={outerContainerRef} 
        className="table-outer-container"
        style={{ overflowX: 'auto' }}
      >
        {/* Header Table */}
        <div style={{ width: totalWidth, overflowX: 'hidden' }}>
          <div style={{ overflowX: 'hidden' }}>
            <table {...tableProps}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <HeaderComponent key={header.id} header={header} />
                    ))}
                  </tr>
                ))}
              </thead>
            </table>
          </div>
        </div>

        {/* Body Table Container */}
        <div 
          ref={tableContainerRef}
          className="table-body-container"
          style={{ 
            overflowY: 'auto', 
            overflowX: 'hidden',
            height: '600px' // Adjust as needed
          }}
        >
          <table {...tableProps}>
            <tbody 
              style={{
                height: virtualizer.getTotalSize(),
                position: 'relative'
              }}
            >
              {virtualRows.map(virtualItem => {
                const row = table.getRowModel().rows[virtualItem.index];
                return (
                  <tr
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <DefaultCell key={cell.id} cell={cell} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContactsList;
