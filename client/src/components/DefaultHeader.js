import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { TableHead } from './ui/Table';

// Utility function to combine class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export function DefaultHeader({ header }) {
  const resizeHandler = header.getResizeHandler();

  return (
    <TableHead
      key={header.column.id}
      colSpan={header.colSpan}
      className={cn("relative font-semibold text-left p-2 bg-background")}
      style={{
        width: header.column.getSize(),
        flex: `0 0 ${header.column.getSize()}px`,
      }}
    >
      <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </span>
      {header.column.getCanResize() && (
        <div
          onDoubleClick={() => header.column.resetSize()}
          onMouseDown={resizeHandler}
          onTouchStart={resizeHandler}
          className={`absolute right-0 top-0 h-full w-5px hover:bg-primary/20 transition-colors duration-200 select-none ${
            header.column.getIsResizing() ? "bg-secondary" : ""
          }`}
          style={{ cursor: "col-resize", touchAction: "none" }}
        />
      )}
    </TableHead>
  );
}

export default DefaultHeader;
