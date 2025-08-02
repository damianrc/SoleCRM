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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const resizeHandler = header.getResizeHandler();

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        ...style,
        width: header.column.getSize(),
        flex: `0 0 ${header.column.getSize()}px`,
      }}
      key={header.column.id}
      colSpan={header.colSpan}
      className={cn(
        "relative font-semibold text-left p-2 bg-background table-header-cell",
        isDragging && "z-50"
      )}
    >
      {/* Draggable header content */}
      <div
        {...attributes}
        {...listeners}
        className="draggable-header-content whitespace-nowrap overflow-hidden text-ellipsis max-w-full cursor-grab active:cursor-grabbing select-none"
        style={{ paddingRight: header.column.getCanResize() ? '10px' : '0' }}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
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
