import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel,
  createColumnHelper
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Table, TableBody, TableHeader, TableRow, TableCell } from './ui/Table.js';
import { DraggableHeader } from './DraggableHeader.js';
import { DefaultCell } from './DefaultCell.js';
import { EditableCell } from './EditableCell.js';
import { Checkbox } from './ui/Checkbox.js';
import { Button } from './ui/Button.js';
import { BulkDeleteModal } from './ui/BulkDeleteModal.js';
import '../styles/tables/table.css';

// Create column helper
const columnHelper = createColumnHelper();

// Name cell component with integrated view button
const NameCell = ({ info, onContactUpdate, onViewContact }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(info.getValue());
  const inputRef = useRef(null);

  // Extract the current value to avoid complex expression in dependency array
  const currentValue = info.getValue();

  // Reset value when cell value changes from outside
  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, info]);

  // Focus input when editing starts but don't auto-select
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Don't auto-select text - just focus the input
    }
  }, [isEditing]);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    
    if (value !== info.getValue() && onContactUpdate) {
      try {
        await onContactUpdate(info.row.original.id, {
          [info.column.id]: value
        });
      } catch (error) {
        console.error('Failed to update contact:', error);
        setValue(info.getValue());
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(info.getValue());
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    onViewContact && onViewContact(info.row.original.id);
  };

  return (
    <div className={`name-cell-container ${isEditing ? 'editing' : ''}`}>
      {isEditing ? (
        <div className="cell-input-container">
          <input
            ref={inputRef}
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="cell-input"
          />
        </div>
      ) : (
        <>
          <div 
            className="name-cell-content"
            onClick={handleClick}
          >
            <span className="name-cell-text">
              {value || ''}
            </span>
          </div>
          <Button
            onClick={handleViewClick}
            variant="ghost"
            size="sm"
            className="name-cell-view-button"
          >
            View
          </Button>
        </>
      )}
    </div>
  );
};

// Generic custom cell component (same behavior as name but without view button)
const CustomCell = ({ info, onContactUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(info.getValue());
  const inputRef = useRef(null);
  const cellRef = useRef(null);

  // Extract the current value to avoid complex expression in dependency array
  const currentValue = info.getValue();

  // Reset value when cell value changes from outside
  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, info]);

  // Focus input when editing starts but don't auto-select
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Don't auto-select text - just focus the input
    }
  }, [isEditing]);

  const handleClick = (e) => {
    e.stopPropagation();
    // Start editing mode for any cell, even if it's empty
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    
    // Always save regardless of whether the value changed
    // This allows adding data to empty cells
    if (onContactUpdate) {
      try {
        console.log(`Updating field ${info.column.id} for contact ${info.row.original.id}:`, value);
        await onContactUpdate(info.row.original.id, {
          [info.column.id]: value === '' ? null : value
        });
      } catch (error) {
        console.error('Failed to update contact:', error);
        setValue(info.getValue());
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(info.getValue());
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <div className={`custom-cell-container ${isEditing ? 'editing' : ''}`} ref={cellRef}>
      {isEditing ? (
        <div className="cell-input-container">
          <input
            ref={inputRef}
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="cell-input"
            placeholder={`Enter ${info.column.id}`}
          />
        </div>
      ) : (
        <div 
          className="editable-cell-display"
          onClick={handleClick}
        >
          <span className="cell-content">
            {value || ''}
          </span>
        </div>
      )}
    </div>
  );
};

const ContactsList = ({ 
  contacts = [], 
  onContactUpdate, 
  onContactSelect, 
  onBulkDelete,
  onViewContact,
  onSelectionChange,
  onBulkDeleteClick,
}) => {
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [columnOrder, setColumnOrder] = useState([
    'select', 'name', 'email', 'phone', 'address', 'suburb', 
    'contactType', 'leadSource', 'status', 'createdAt', 'updatedAt'
  ]);
  
  // Refs for virtualization
  const tableContainerRef = useRef(null);
  const outerContainerRef = useRef(null);

  // Dynamic height calculation
  const [containerHeight, setContainerHeight] = useState('calc(100vh - 280px)');
  
  useEffect(() => {
    const calculateHeight = () => {
      // Calculate available height based on actual page elements
      const headerHeight = 180; // Increased to give more space for buttons and future additions
      const paginationHeight = 80; // Approximate height of pagination
      const padding = 80; // Additional padding/margins
      const availableHeight = window.innerHeight - headerHeight - paginationHeight - padding;
      setContainerHeight(`${Math.max(300, availableHeight)}px`); // Minimum 300px height
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      status: contact.status || '',
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }));
  }, [contacts]);

  // Enhanced column definitions with drag and resize functionality
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <div className="h-full flex items-center">
          <Checkbox
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => {
              table.toggleAllRowsSelected(!!value);
            }}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="h-full flex items-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
            }}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      enableReordering: false, // Prevent dragging
      size: 50,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <NameCell 
          info={info}
          onContactUpdate={onContactUpdate}
          onViewContact={onViewContact}
        />
      ),
      size: 200,
      enableResizing: true,
      enableReordering: false, // Prevent dragging
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <CustomCell
          info={info}
          onContactUpdate={onContactUpdate}
        />
      ),
      size: 250,
      enableResizing: true,
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => (
        <CustomCell
          info={info}
          onContactUpdate={onContactUpdate}
        />
      ),
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('address', {
      header: 'Address',
      cell: (info) => (
        <CustomCell
          info={info}
          onContactUpdate={onContactUpdate}
        />
      ),
      size: 300,
      enableResizing: true,
    }),
    columnHelper.accessor('suburb', {
      header: 'Suburb',
      cell: (info) => (
        <CustomCell
          info={info}
          onContactUpdate={onContactUpdate}
        />
      ),
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('contactType', {
      header: 'Type',
      cell: (cellInfo) => (
        <EditableCell
          cell={{
            ...cellInfo,
            column: {
              ...cellInfo.column,
              getSize: () => 150,
              id: 'contactType'
            }
          }}
          getValue={cellInfo.getValue}
          row={cellInfo.row}
          column={cellInfo.column}
          table={cellInfo.table}
          onUpdate={onContactUpdate}
        />
      ),
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('leadSource', {
      header: 'Source',
      cell: (info) => (
        <CustomCell
          info={info}
          onContactUpdate={onContactUpdate}
        />
      ),
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (cellInfo) => (
        <EditableCell
          cell={{
            ...cellInfo,
            column: {
              ...cellInfo.column,
              getSize: () => 150,
              id: 'status'
            }
          }}
          getValue={cellInfo.getValue}
          row={cellInfo.row}
          column={cellInfo.column}
          table={cellInfo.table}
          onUpdate={onContactUpdate}
        />
      ),
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? new Date(value).toLocaleDateString() : '';
      },
      size: 120,
      enableResizing: true,
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Updated',
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? new Date(value).toLocaleDateString() : '';
      },
      size: 120,
      enableResizing: true,
    }),
  ], [onViewContact, onContactUpdate]);

  // Create table instance with enhanced settings
  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableMultiRowSelection: true, // Explicitly enable multi-row selection
    getRowId: (row) => String(row.id), // Ensure row IDs are strings
    state: {
      rowSelection,
      sorting,
      columnOrder,
    },
    debugTable: false,
  });

  // Calculate total table width
  const totalTableWidth = useMemo(() => {
    return table.getTotalSize();
  }, [table]);

  // Setup virtualization for rows
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 42, // Increased from 35 to 42 for slightly taller rows
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Get selected row IDs
  const selectedRowIds = useMemo(() => {
    return Object.keys(rowSelection).filter(id => rowSelection[id]);
  }, [rowSelection]);

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRowIds);
    }
  }, [selectedRowIds, onSelectionChange]);

  // Handle drag end for column reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      // Prevent moving columns that are not reorderable
      const activeCol = columns.find(col => col.id === active.id || col.accessorKey === active.id);
      const overCol = columns.find(col => col.id === over.id || col.accessorKey === over.id);
      if ((activeCol && activeCol.enableReordering === false) || (overCol && overCol.enableReordering === false)) {
        return;
      }
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleBulkDeleteConfirm = useCallback(() => {
    if (selectedRowIds.length > 0 && onBulkDelete) {
      onBulkDelete(selectedRowIds);
      setRowSelection({});
    }
    setShowBulkDeleteModal(false);
  }, [selectedRowIds, onBulkDelete]);

  const handleBulkDeleteCancel = useCallback(() => {
    setShowBulkDeleteModal(false);
  }, []);

  // Shared table props to ensure consistent rendering
  const tableProps = {
    style: {
      width: `${totalTableWidth}px`,
      tableLayout: "fixed",
    },
  };

  return (
    <div className="contacts-container">
      {showBulkDeleteModal && (
        <BulkDeleteModal
          selectedCount={selectedRowIds.length}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={handleBulkDeleteCancel}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div
          className="table-outer-wrapper"
          style={{
            width: "100%",
          }}
          ref={outerContainerRef}
        >
          <div style={{ width: Math.max(totalTableWidth + 10, 100) + "px" }}>
            {/* Header Table */}
            <div className="table-header-wrapper">
              <Table {...tableProps}>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="flex w-full">
                      <SortableContext
                        items={columnOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header) => (
                          <DraggableHeader 
                            key={header.column.id} 
                            header={header}
                            columnId={header.column.id}
                          />
                        ))}
                      </SortableContext>
                    </TableRow>
                  ))}
                </TableHeader>
              </Table>
            </div>

            {/* Body Table - only vertical scrolling */}
            <div
              ref={tableContainerRef}
              className="table-body-wrapper"
              style={{
                width: Math.max(totalTableWidth + 10, 100) + "px",
                height: containerHeight, // Dynamic height based on viewport
                overflowY: "auto",
                overflowX: "hidden",
              }}
              onWheel={(e) => {
                // If this is a horizontal scroll attempt, let the parent handle it
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                  e.stopPropagation();
                  if (outerContainerRef.current) {
                    outerContainerRef.current.scrollLeft += e.deltaX;
                  }
                }
              }}
            >
              <Table {...tableProps}>
                <TableBody
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualRows.map((virtualItem) => {
                    const row = rows[virtualItem.index];
                    return (
                      <TableRow
                        key={virtualItem.key}
                        className="absolute top-0 left-0 flex w-full items-center"
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => {
                          // Use DefaultCell for non-data columns and EditableCell is handled in column definition
                          if (cell.column.id === 'select' || cell.column.id === 'actions' || 
                              cell.column.id === 'createdAt' || cell.column.id === 'updatedAt') {
                            return <DefaultCell key={cell.id} cell={cell} />;
                          }
                          // For editable columns, the EditableCell is already defined in the column definition
                          return (
                            <TableCell
                              key={cell.id}
                              style={{
                                width: cell.column.getSize(),
                                flex: `0 0 ${cell.column.getSize()}px`,
                                minWidth: 0,
                                overflow: 'hidden',
                                padding: '0.5rem',
                                color: 'var(--color-primary-text)',
                              }}
                            >
                              {cell.column.columnDef.cell(cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DndContext>

      <div className="table-footer">
        {selectedRowIds.length} of {table.getFilteredRowModel().rows.length} rows selected
      </div>
    </div>
  );
};

export default ContactsList;
// No hardcoded color values found. No changes needed.
