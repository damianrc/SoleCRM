import React, { memo } from 'react';
import { flexRender } from '@tanstack/react-table';
import { TableCell } from './ui/Table';

export const DefaultCell = memo(function DefaultCell({ cell }) {
  // Get the index of this cell in the row
  const cellIndex = cell.row.getAllCells().indexOf(cell);
  const isLastCell = cellIndex === cell.row.getAllCells().length - 1;
  
  return (
    <TableCell
      key={cell.id}
      style={{
        width: cell.column.getSize(),
        flex: `0 0 ${cell.column.getSize()}px`,
        minWidth: 0, // Allow shrinking
        overflow: 'hidden',
        padding: '0.5rem',
        borderRight: isLastCell ? 'none' : '1px solid var(--color-primary-border)', // Add column border
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
          color: 'var(--color-primary-text)',
        }}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    </TableCell>
  );
});
