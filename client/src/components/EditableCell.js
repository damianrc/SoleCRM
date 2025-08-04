import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from './ui/Table';

export function EditableCell({ 
  cell, 
  getValue, 
  row, 
  column, 
  table,
  onUpdate 
}) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  // Reset value when cell value changes from outside
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Only call select() for input elements, not select elements
      if (inputRef.current.select && typeof inputRef.current.select === 'function') {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleClick = (e) => {
    e.stopPropagation();
    console.log('Cell clicked:', column.id, 'value:', value, 'initialValue:', initialValue);
    // Don't allow editing of certain columns
    const nonEditableColumns = ['select', 'actions', 'createdAt', 'updatedAt'];
    if (nonEditableColumns.includes(column.id)) {
      console.log('Column not editable:', column.id);
      return;
    }
    console.log('Setting editing to true for column:', column.id);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    
    // Only save if value has changed
    if (value !== initialValue && onUpdate) {
      try {
        // Get the current contact data and merge with the changed field
        const currentContact = row.original;
        const updatedData = {
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone,
          address: currentContact.address,
          suburb: currentContact.suburb,
          contactType: currentContact.contactType,
          leadSource: currentContact.leadSource,
          status: currentContact.status,
          // Override the specific field that was changed
          [column.id]: value
        };
        
        await onUpdate(row.original.id, updatedData);
      } catch (error) {
        console.error('Failed to update cell:', error);
        // Revert to original value on error
        setValue(initialValue);
      }
    } else {
      // No update needed - value unchanged
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const formatDisplayValue = (val) => {
    // Handle special formatting for certain columns
    if (column.id === 'contactType') {
      const displayValue = {
        'BUYER': 'Buyer',
        'SELLER': 'Seller', 
        'PAST_CLIENT': 'Past Client',
        'LEAD': 'Lead'
      }[val] || val;
      return displayValue;
    }
    
    if (column.id === 'status') {
      const displayValue = {
        'NEW': 'New',
        'CONTACTED': 'Contacted',
        'QUALIFIED': 'Qualified',
        'PROPOSAL': 'Proposal',
        'NEGOTIATION': 'Negotiation',
        'CLOSED_WON': 'Closed Won',
        'CLOSED_LOST': 'Closed Lost'
      }[val] || val;
      return displayValue;
    }

    if ((column.id === 'createdAt' || column.id === 'updatedAt') && val) {
      return new Date(val).toLocaleDateString();
    }

    return val === null || val === undefined ? '' : String(val);
  };

  const renderInput = () => {
    if (column.id === 'contactType') {
      return (
        <select
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none text-sm"
        >
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
          <option value="PAST_CLIENT">Past Client</option>
          <option value="LEAD">Lead</option>
        </select>
      );
    }

    if (column.id === 'status') {
      return (
        <select
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none text-sm"
        >
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="PROPOSAL">Proposal</option>
          <option value="NEGOTIATION">Negotiation</option>
          <option value="CLOSED_WON">Closed Won</option>
          <option value="CLOSED_LOST">Closed Lost</option>
        </select>
      );
    }

    // For email, phone, and other text fields
    return (
      <input
        ref={inputRef}
        type={column.id === 'email' ? 'email' : 'text'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-none outline-none text-sm"
      />
    );
  };

  return (
    <TableCell
      style={{
        width: cell.column.getSize(),
        flex: `0 0 ${cell.column.getSize()}px`,
      }}
      className={`relative ${isEditing ? 'editing' : ''}`}
      onClick={handleClick}
    >
      {isEditing ? (
        <div className="w-full h-full flex items-center px-1">
          {renderInput()}
        </div>
      ) : (
        <div 
          className="w-full h-full flex items-center cursor-pointer hover:bg-gray-50 px-1 rounded transition-colors duration-150 min-h-[32px]"
          onClick={handleClick}
          style={{ overflow: 'hidden', minWidth: 0 }}
        >
          <span 
            className="text-sm"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              display: 'block',
              minWidth: 0
            }}
          >
            {formatDisplayValue(value)}
          </span>
        </div>
      )}
    </TableCell>
  );
}
