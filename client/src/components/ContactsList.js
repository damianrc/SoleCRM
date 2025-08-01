import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Eye, 
  PlusCircle, 
  Filter, 
  XCircle,
  GripVertical 
} from 'lucide-react';
import '../styles/table.css';

/**
 * ContactsList Component
 * 
 * This component displays a table of contacts with features like:
 * - Search functionality
 * - Column visibility toggle
 * - Bulk selection and actions
 * - Inline editing of contact fields
 * - Navigation to contact detail view
 * 
 * Props:
 * - contacts: Array of contact objects
 * - onContactUpdate: Function to update a contact's field
 * - onContactSelect: Function called when a contact is selected for detail view
 * - onAddContact: Function to open the add contact modal
 * - onBulkDelete: Function to delete selected contacts
 */
const ContactsList = ({ 
  contacts, 
  onContactUpdate, 
  onContactSelect, 
  onAddContact,
  onBulkDelete 
}) => {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // UI control states
  const [selectedRows, setSelectedRows] = useState([]); // IDs of selected contacts
  const [visibleColumns, setVisibleColumns] = useState(['name', 'email', 'phone', 'address', 'status']);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  
  // Interactive table states
  const [columnOrder, setColumnOrder] = useState(['name', 'email', 'phone', 'address', 'status']);
  const [columnWidths, setColumnWidths] = useState({
    name: 200,
    email: 250,
    phone: 150,
    address: 300,
    status: 120
  });
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  
  // Column resizing states
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [resizeData, setResizeData] = useState({
    startX: 0,
    startWidth: 0
  });
  
  // Refs for drag and drop
  const tableRef = useRef(null);

  // Inline editing state
  const [editingField, setEditingField] = useState({ 
    id: null, 
    field: null, 
    value: '', 
    type: null 
  });

  // Hover state for name column view button
  const [hoveredRow, setHoveredRow] = useState(null);

  /**
   * Load saved table configuration from localStorage on component mount
   * Ensure name column is always visible
   */
  useEffect(() => {
    const savedConfig = localStorage.getItem('contactsTableConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.columnOrder) {
          // Ensure name is first in column order
          const orderWithName = config.columnOrder.filter(col => col !== 'name');
          orderWithName.unshift('name');
          setColumnOrder(orderWithName);
        }
        if (config.columnWidths) setColumnWidths(config.columnWidths);
        if (config.visibleColumns) {
          // Ensure name column is always visible
          const visibleWithName = config.visibleColumns.includes('name') 
            ? config.visibleColumns 
            : ['name', ...config.visibleColumns];
          setVisibleColumns(visibleWithName);
        }
      } catch (error) {
        console.error('Error loading table configuration:', error);
      }
    }
  }, []);

  /**
   * Save table configuration to localStorage whenever it changes
   */
  useEffect(() => {
    const config = {
      columnOrder,
      columnWidths,
      visibleColumns
    };
    localStorage.setItem('contactsTableConfig', JSON.stringify(config));
  }, [columnOrder, columnWidths, visibleColumns]);

  /**
   * Handle mouse move during column resizing
   */
  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizingColumn) return;
    
    const diff = e.clientX - resizeData.startX;
    const newWidth = Math.max(80, resizeData.startWidth + diff); // Minimum width of 80px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  }, [isResizing, resizingColumn, resizeData]);

  /**
   * Handle mouse up - stop resizing
   */
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizingColumn(null);
      setResizeData({ startX: 0, startWidth: 0 });
    }
  }, [isResizing]);

  /**
   * Set up global mouse event listeners for resizing
   */
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  /**
   * Handle column drag start - prevent dragging selection and name columns
   */
  const handleColumnDragStart = (e, column) => {
    // Prevent dragging selection and name columns
    if (column === 'name') {
      e.preventDefault();
      return;
    }
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  /**
   * Handle column drag over
   */
  const handleColumnDragOver = (e, column) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(column);
  };

  /**
   * Handle column drop - prevent dropping on name column and maintain name as first column
   */
  const handleColumnDrop = (e, targetColumn) => {
    e.preventDefault();
    
    // Prevent dropping on name column
    if (targetColumn === 'name') {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    
    if (draggedColumn && draggedColumn !== targetColumn) {
      const newOrder = [...columnOrder];
      const draggedIndex = newOrder.indexOf(draggedColumn);
      const targetIndex = newOrder.indexOf(targetColumn);
      
      // Remove dragged column and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);
      
      // Ensure name column is always first in the order
      const nameIndex = newOrder.indexOf('name');
      if (nameIndex !== 0) {
        newOrder.splice(nameIndex, 1);
        newOrder.unshift('name');
      }
      
      setColumnOrder(newOrder);
    }
    
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  /**
   * Handle column drag end
   */
  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  /**
   * Start column resizing
   */
  const startResize = (e, column) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizingColumn(column);
    setResizeData({
      startX: e.clientX,
      startWidth: columnWidths[column]
    });
  };

  /**
   * Filter contacts based on search term and status filter
   */
  const filteredContacts = contacts.filter(contact => {
    // Check if contact matches search term (name, email, or phone)
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.phone || '').includes(searchTerm);
    
    // Check if contact matches status filter (if any)
    const matchesStatus = !statusFilter || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  /**
   * Handle search input with debouncing to avoid excessive filtering
   * @param {Event} e - Input change event
   */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    
    // Clear existing timeout to debounce search
    clearTimeout(searchTimeout);
    
    // Set new timeout to update search term after 300ms of no typing
    setSearchTimeout(setTimeout(() => {
      setSearchTerm(value);
    }, 300));
  };

  /**
   * Toggle visibility of a table column - prevent hiding name column
   * @param {string} column - Column name to toggle
   */
  const handleColumnToggle = (column) => {
    // Prevent hiding the name column
    if (column === 'name') {
      return;
    }
    
    setVisibleColumns(prev => {
      if (prev.includes(column)) {
        // Remove column if it's currently visible
        return prev.filter(c => c !== column);
      } else {
        // Add column if it's currently hidden - maintain order from columnOrder
        const newVisible = [...prev];
        const columnOrderIndex = columnOrder.indexOf(column);
        
        // Find the correct position to insert the column based on columnOrder
        let insertIndex = newVisible.length;
        for (let i = 0; i < newVisible.length; i++) {
          const currentColumnOrderIndex = columnOrder.indexOf(newVisible[i]);
          if (columnOrderIndex < currentColumnOrderIndex) {
            insertIndex = i;
            break;
          }
        }
        
        newVisible.splice(insertIndex, 0, column);
        return newVisible;
      }
    });
  };

  /**
   * Handle individual row selection for bulk actions
   * @param {number} contactId - ID of contact to toggle selection
   * @param {Event} e - Event object to stop propagation
   */
  const handleSelectRow = (contactId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedRows(prev => {
      if (prev.includes(contactId)) {
        // Remove from selection if already selected
        return prev.filter(id => id !== contactId);
      } else {
        // Add to selection if not selected
        return [...prev, contactId];
      }
    });
  };

  /**
   * Handle "select all" checkbox toggle
   * @param {Event} e - Checkbox change event
   */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all visible contacts
      setSelectedRows(filteredContacts.map(c => c.id));
    } else {
      // Deselect all contacts
      setSelectedRows([]);
    }
  };

  /**
   * Start inline editing of a cell
   * @param {Object} contact - Contact object being edited
   * @param {string} field - Field name being edited
   * @param {Event} e - Click event
   */
  const handleCellClick = (contact, field, e) => {
    e.stopPropagation(); // Prevent row selection when clicking on editable cell
    
    setEditingField({
      id: contact.id,
      field: field,
      value: contact[field] || '',
      type: field === 'status' ? 'select' : 'text' // Different input types for different fields
    });
  };

  /**
   * Handle input change during inline editing
   * @param {Event} e - Input change event
   */
  const handleEditChange = (e) => {
    setEditingField(prev => ({ 
      ...prev, 
      value: e.target.value 
    }));
  };

  /**
   * Handle keyboard events during inline editing
   * @param {Event} e - Keyboard event
   * @param {number} contactId - ID of contact being edited
   * @param {string} column - Column being edited
   */
  const handleKeyDown = (e, contactId, column) => {
    if (e.key === 'Enter') {
      // Save changes on Enter key
      saveEdit(contactId, column);
    } else if (e.key === 'Escape') {
      // Cancel editing on Escape key
      cancelEdit();
    }
  };

  /**
   * Save the current edit and update the contact
   * @param {number} contactId - ID of contact to update
   * @param {string} column - Column that was edited
   */
  const saveEdit = (contactId, column) => {
    onContactUpdate(contactId, column, editingField.value);
    cancelEdit();
  };

  /**
   * Cancel current editing session
   */
  const cancelEdit = () => {
    setEditingField({ id: null, field: null, value: '', type: null });
  };

  /**
   * Handle bulk delete of selected contacts
   */
  const handleBulkDelete = () => {
    onBulkDelete(selectedRows);
    setSelectedRows([]); // Clear selection after delete
  };

  /**
   * Reset table configuration to defaults - ensure name column is always visible
   */
  const resetTableConfiguration = () => {
    const defaultConfig = {
      columnOrder: ['name', 'email', 'phone', 'address', 'status'],
      columnWidths: {
        name: 200,
        email: 250,
        phone: 150,
        address: 300,
        status: 120
      },
      visibleColumns: ['name', 'email', 'phone', 'address', 'status']
    };
    
    setColumnOrder(defaultConfig.columnOrder);
    setColumnWidths(defaultConfig.columnWidths);
    setVisibleColumns(defaultConfig.visibleColumns);
    
    // Also clear from localStorage
    localStorage.removeItem('contactsTableConfig');
  };

  return (
    <div className="crm-container">
      {/* Header Actions - Search, Filters, Bulk Actions */}
      <div className="table-header-actions">
        {/* Search Input */}
        <div>
          <input
            type="text"
            placeholder="Search contacts..."
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        {/* Column Visibility Toggle */}
        <div>
          <button onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}>
            <Filter size={16} /> Columns
          </button>
          {isColumnSelectorOpen && (
            <div className="column-selector">
              <h4>Available Columns</h4>
              {columnOrder.filter(column => column !== 'name').map(column => (
                <label key={column}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column)}
                    onChange={() => handleColumnToggle(column)}
                  />
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                </label>
              ))}
              <hr style={{ margin: '12px 0' }} />
              <button 
                onClick={resetTableConfiguration}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: '#ef4444', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                Reset to Default
              </button>
            </div>
          )}
        </div>

        {/* Add Contact Button */}
        <div>
          <button onClick={onAddContact}>
            <PlusCircle size={16} /> Add Contact
          </button>
        </div>

        {/* Delete Selected Button - Only shown when contacts are selected */}
        {selectedRows.length > 0 && (
          <div>
            <button onClick={handleBulkDelete} className="delete-selected-button">
              <XCircle size={16} /> Delete Selected ({selectedRows.length})
            </button>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="contacts-table-container">
        <table 
          className={`contacts-table ${draggedColumn ? 'dragging' : ''}`} 
          ref={tableRef}
        >
          <thead>
            <tr>
              {/* Selection Column Header - Always visible and non-draggable */}
              <th style={{ width: '50px', minWidth: '50px', textAlign: 'center' }} className="selection-column">
                <input
                  type="checkbox"
                  checked={selectedRows.length === filteredContacts.length && filteredContacts.length > 0}
                  onChange={handleSelectAll}
                  title="Select all contacts"
                />
              </th>
              
              {/* Dynamic Column Headers with Drag & Drop and Resize */}
              {columnOrder.filter(column => visibleColumns.includes(column)).map((column) => (
                <th 
                  key={column}
                  draggable={column !== 'name'}
                  onDragStart={(e) => handleColumnDragStart(e, column)}
                  onDragOver={(e) => handleColumnDragOver(e, column)}
                  onDrop={(e) => handleColumnDrop(e, column)}
                  onDragEnd={handleColumnDragEnd}
                  style={{ 
                    width: `${columnWidths[column]}px`,
                    minWidth: `${columnWidths[column]}px`,
                    position: 'relative',
                    opacity: draggedColumn === column ? 0.5 : 1,
                    cursor: column === 'name' ? 'default' : 'move'
                  }}
                  className={`${column === 'name' ? 'non-draggable-header' : 'draggable-header'} ${draggedColumn === column ? 'dragging' : ''} ${dragOverColumn === column ? 'drag-over' : ''} ${resizingColumn === column ? 'resizing' : ''}`}
                >
                  <div className="column-header-content">
                    {column !== 'name' && <GripVertical size={14} className="drag-handle" />}
                    <span>{column.charAt(0).toUpperCase() + column.slice(1)}</span>
                  </div>
                  
                  {/* Column Resizer */}
                  <div 
                    className="column-resizer"
                    onMouseDown={(e) => startResize(e, column)}
                    title="Drag to resize column"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Show message if no contacts found */}
            {!filteredContacts || filteredContacts.length === 0 ? (
              <tr>
                <td 
                  colSpan={visibleColumns.length + 1} 
                  style={{ textAlign: 'center', color: '#888' }}
                >
                  No contacts found.
                </td>
              </tr>
            ) : (
              /* Render each contact row */
              filteredContacts.map((contact) => (
                <tr 
                  key={contact.id}
                  className={selectedRows.includes(contact.id) ? 'selected' : ''}
                >
                  {/* Selection Checkbox Cell - Always visible */}
                  <td style={{ width: '50px', padding: '8px', textAlign: 'center' }} className="selection-cell">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(contact.id)}
                      onChange={(e) => handleSelectRow(contact.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>

                  {/* Dynamic Data Cells */}
                  {columnOrder.filter(column => visibleColumns.includes(column)).map((column) => (
                    <td 
                      key={column} 
                      className={`editable-cell ${column === 'name' ? 'name-cell' : ''}`}
                      onClick={(e) => handleCellClick(contact, column, e)}
                      onMouseEnter={() => column === 'name' && setHoveredRow(contact.id)}
                      onMouseLeave={() => column === 'name' && setHoveredRow(null)}
                      style={{ 
                        cursor: 'pointer',
                        width: `${columnWidths[column]}px`,
                        minWidth: `${columnWidths[column]}px`,
                        position: column === 'name' ? 'relative' : 'static'
                      }}
                      title="Click to edit"
                    >
                      {/* Show input/select when editing, otherwise show value */}
                      {editingField.id === contact.id && editingField.field === column ? (
                        /* Editing Mode */
                        column === 'status' ? (
                          /* Status Dropdown */
                          <select
                            className="editable-select"
                            value={editingField.value}
                            onChange={handleEditChange}
                            onBlur={() => saveEdit(contact.id, column)}
                            autoFocus
                          >
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="QUALIFIED">Qualified</option>
                            <option value="PROPOSAL">Proposal</option>
                            <option value="NEGOTIATION">Negotiation</option>
                            <option value="CLOSED_WON">Closed Won</option>
                            <option value="CLOSED_LOST">Closed Lost</option>
                          </select>
                        ) : (
                          /* Text Input */
                          <input
                            type="text"
                            value={editingField.value}
                            onChange={handleEditChange}
                            onBlur={() => saveEdit(contact.id, column)}
                            onKeyDown={(e) => handleKeyDown(e, contact.id, column)}
                            autoFocus
                          />
                        )
                      ) : (
                        /* Display Mode */
                        column === 'name' ? (
                          <div className="name-cell-content">
                            <span className={`name-text ${hoveredRow === contact.id ? 'truncated' : ''}`}>
                              {contact[column] || ''}
                            </span>
                            {hoveredRow === contact.id && (
                              <button 
                                className="hover-view-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onContactSelect(contact);
                                }}
                                title="View Details"
                              >
                                View
                              </button>
                            )}
                          </div>
                        ) : (
                          <span>{contact[column] || ''}</span>
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactsList;