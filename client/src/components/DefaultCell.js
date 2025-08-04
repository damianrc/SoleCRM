import React, { memo } from 'react';
import { flexRender } from '@tanstack/react-table';
import { TableCell } from './ui/Table';

export const DefaultCell = memo(function DefaultCell({ cell }) {
  return (
    <TableCell
      key={cell.id}
      style={{
        width: cell.column.getSize(),
        flex: `0 0 ${cell.column.getSize()}px`,
        minWidth: 0, // Allow shrinking
        overflow: 'hidden',
        padding: '0.5rem',
      }}
    >
      <div 
        className="cell-content"
        style={{
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    </TableCell>
  );
});
