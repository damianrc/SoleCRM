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
import { Table, TableBody, TableHeader, TableRow } from './ui/Table';
import { DraggableHeader } from './DraggableHeader';
import { DefaultCell } from './DefaultCell';
import { Checkbox } from './ui/Checkbox';
import { Button } from './ui/Button';
import '../styles/contacts-table.css';

// Create column helper
const columnHelper = createColumnHelper();

// Modal component for bulk delete confirmation
const BulkDeleteModal = ({ selectedCount, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete {selectedCount} selected contacts?</p>
      <div className="modal-actions">
        <Button onClick={onCancel} variant="outline">Cancel</Button>
        <Button onClick={onConfirm} variant="destructive">Delete</Button>
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
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [columnOrder, setColumnOrder] = useState([
    'select', 'name', 'email', 'phone', 'address', 'suburb', 
    'contactType', 'leadSource', 'status', 'createdAt', 'updatedAt', 'actions'
  ]);
  
  // Refs for virtualization
  const tableContainerRef = useRef(null);
  const outerContainerRef = useRef(null);

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
      status: contact.status || ''
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
              console.log('Select all clicked, value:', value);
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
              console.log('Row checkbox clicked, value:', value, 'row id:', row.id);
              row.toggleSelected(!!value);
            }}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 40,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue(),
      size: 200,
      enableResizing: true,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue(),
      size: 250,
      enableResizing: true,
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => info.getValue(),
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('address', {
      header: 'Address',
      cell: (info) => info.getValue(),
      size: 300,
      enableResizing: true,
    }),
    columnHelper.accessor('suburb', {
      header: 'Suburb',
      cell: (info) => info.getValue(),
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('contactType', {
      header: 'Type',
      cell: ({ getValue }) => {
        const value = getValue();
        const displayValue = {
          'BUYER': 'Buyer',
          'SELLER': 'Seller', 
          'PAST_CLIENT': 'Past Client',
          'LEAD': 'Lead'
        }[value] || value;
        return displayValue;
      },
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('leadSource', {
      header: 'Source',
      cell: (info) => info.getValue(),
      size: 150,
      enableResizing: true,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const value = getValue();
        const displayValue = {
          'NEW': 'New',
          'CONTACTED': 'Contacted',
          'QUALIFIED': 'Qualified',
          'PROPOSAL': 'Proposal',
          'NEGOTIATION': 'Negotiation',
          'CLOSED_WON': 'Closed Won',
          'CLOSED_LOST': 'Closed Lost'
        }[value] || value;
        return displayValue;
      },
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
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          onClick={() => onViewContact && onViewContact(row.original.id)}
          variant="ghost"
          size="sm"
        >
          View
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 100,
    }),
  ], [onViewContact]);

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
    debugTable: false, // Set to true if you want to see table debug info
  });

  // Debug row selection - moved after table creation
  useEffect(() => {
    console.log('Row selection state:', rowSelection);
    console.log('All rows selected:', table.getIsAllRowsSelected());
    console.log('Some rows selected:', table.getIsSomeRowsSelected());
    console.log('Selected rows count:', Object.keys(rowSelection).filter(id => rowSelection[id]).length);
  }, [rowSelection, table]);

  // Calculate total table width
  const totalTableWidth = useMemo(() => {
    return table.getTotalSize();
  }, [table]);

  // Setup virtualization for rows
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Get selected row IDs
  const selectedRowIds = useMemo(() => {
    return Object.keys(rowSelection).filter(id => rowSelection[id]);
  }, [rowSelection]);

  // Handle drag end for column reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Bulk delete handlers
  const handleBulkDeleteClick = useCallback(() => {
    setShowBulkDeleteModal(true);
  }, []);

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

      {selectedRowIds.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="selected-count">{selectedRowIds.length} selected</span>
          <Button 
            onClick={handleBulkDeleteClick}
            variant="destructive"
            size="sm"
          >
            Delete Selected
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div
          className="table-outer-wrapper"
          style={{
            maxWidth: "100%",
            overflow: "auto",
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
                height: `400px`,
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
                        {row.getVisibleCells().map((cell) => (
                          <DefaultCell key={cell.id} cell={cell} />
                        ))}
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
