import React from 'react';

// Utility function to combine class names (simplified cn function)
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

function Table({ className, ...props }) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:flex [&:has([role=checkbox])]:items-center [&:has([role=checkbox])]:justify-center",
        className
      )}
      style={{
        borderRight: '1px solid var(--color-primary-border)', // Use theme variable for column separator
        backgroundColor: 'var(--color-table-header-bg)', // Use theme variable for header background
        color: 'var(--color-primary-text)', // Use theme variable for header text
        ...props.style
      }}
      {...props}
    />
  );
}

function TableCell({ className, isLastCell = false, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap overflow-hidden text-ellipsis [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:flex [&:has([role=checkbox])]:items-center [&:has([role=checkbox])]:justify-center",
        className
      )}
      style={{
        maxWidth: 0, // This forces the cell to respect its container width
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        borderRight: isLastCell ? 'none' : '1px solid var(--color-primary-border)', // Use theme variable for column separator
        backgroundColor: 'var(--color-primary-bg)', // Use theme variable for cell background
        color: 'var(--color-primary-text)', // Use theme variable for cell text
        ...props.style
      }}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
