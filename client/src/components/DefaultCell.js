import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { TableCell } from './ui/Table';

export function DefaultCell({ cell }) {
  return (
    <TableCell
      key={cell.id}
      style={{
        width: cell.column.getSize(),
        flex: `0 0 ${cell.column.getSize()}px`,
      }}
    >
      <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-full block">
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </span>
    </TableCell>
  );
}
