import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead } from './ui/Table';

// Utility function to combine class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};


export function DraggableHeader({ header, columnId }) {
  const isReorderable = header.column.columnDef.enableReordering !== false;
  const isSortable = header.column.getCanSort?.() && header.column.columnDef.enableSorting !== false;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnId, disabled: !isReorderable });

  const style = isReorderable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : {};

  const resizeHandler = header.getResizeHandler();

  // Sorting indicator logic - two arrows with conditional highlighting
  const currentSort = header.column.getIsSorted();
  const renderSortIcon = () => {
    if (!isSortable) return null;
    
    return (
      <div className="sort-arrows" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <div 
          style={{ 
            fontSize: '0.6em', 
            color: currentSort === 'asc' ? 'var(--color-accent)' : 'var(--color-secondary-text)',
            transition: 'color 0.2s ease'
          }}
        >
          ▲
        </div>
        <div 
          style={{ 
            fontSize: '0.6em', 
            color: currentSort === 'desc' ? 'var(--color-accent)' : 'var(--color-secondary-text)',
            transition: 'color 0.2s ease',
            marginTop: '-2px'
          }}
        >
          ▼
        </div>
      </div>
    );
  };

  // Click handler for sorting (cycle: none -> asc -> desc -> none)
  const handleSortClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isSortable) return;
    
    // Cycle sort: none -> asc -> desc -> none
    const current = header.column.getIsSorted();
    if (!current) header.column.toggleSorting(false); // asc
    else if (current === 'asc') header.column.toggleSorting(true); // desc
    else header.column.clearSorting(); // none
  };

  // Keyboard accessibility for sort button
  const handleSortKeyDown = (e) => {
    if (!isSortable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSortClick(e);
    }
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        ...style,
        width: header.column.getSize(),
        flex: `0 0 ${header.column.getSize()}px`,
        color: 'var(--color-primary-text)',
      }}
      key={header.column.id}
      colSpan={header.colSpan}
      className={cn(
        "relative font-semibold text-left p-2 bg-background table-header-cell",
        isDragging && isReorderable && "z-50"
      )}
    >
      {/* Header content with drag handle, text, and sort button */}
      <div className="flex items-center w-full gap-2">
        {/* Drag handle - 6 dots icon */}
        {isReorderable && (
          <div
            {...attributes}
            {...listeners}
            className="drag-handle cursor-grab active:cursor-grabbing flex-shrink-0"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr',
              gap: '1.5px',
              width: '10px',
              height: '14px',
              padding: '2px',
            }}
            title="Drag to reorder column"
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '2.5px',
                  height: '2.5px',
                  backgroundColor: 'var(--color-secondary-text)',
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>
        )}
        
        {/* Column header text - not draggable */}
        <div className={cn(
          "flex-1 whitespace-nowrap overflow-hidden text-ellipsis select-none",
          header.column.id === 'select' && "flex items-center justify-center"
        )}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>
        
        {/* Sort button - separate from drag handle */}
        {isSortable && (
          <button
            type="button"
            onClick={handleSortClick}
            onKeyDown={handleSortKeyDown}
            tabIndex={0}
            aria-label="Sort column"
            className="sort-button flex-shrink-0"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              userSelect: 'none',
              minWidth: '20px',
              justifyContent: 'center',
              borderRadius: '2px',
              transition: 'background-color 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(var(--color-accent-rgb), 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {renderSortIcon()}
          </button>
        )}
      </div>

      {/* Resize handle - separate from drag handle */}
      {header.column.getCanResize() && (
        <div
          onMouseDown={resizeHandler}
          onTouchStart={resizeHandler}
          className="resize-handle"
          style={{ touchAction: "none", zIndex: 10 }}
        />
      )}
    </TableHead>
  );
}

export default DraggableHeader;
