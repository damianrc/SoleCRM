import React from 'react';
import { TableCell } from './ui/Table';

// Utility function to combine class names (simplified cn function)
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// This is a wrapper for TableCell that applies column border styling
export function BorderedTableCell({ className, isLastColumn, ...props }) {
  return (
    <TableCell
      className={cn(className)}
      style={{
        borderRight: isLastColumn ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
        ...props.style
      }}
      {...props}
    />
  );
}
