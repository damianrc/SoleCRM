import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from './ui/Table';
import '../styles/editable-cell.css';

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
  const cellRef = useRef(null);

  // Reset value when cell value changes from outside
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Focus input when editing starts but don't auto-select
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Don't auto-select text - just focus the input
    }
  }, [isEditing]);

  const handleClick = (e) => {
    e.stopPropagation();
    // Don't allow editing of certain columns
    const nonEditableColumns = ['select', 'actions', 'createdAt', 'updatedAt'];
    if (nonEditableColumns.includes(column.id)) {
      return;
    }
    
    // Start editing mode
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    
    // Always attempt to update the cell, regardless of whether the value changed
    // or whether it was empty before - this is key to fixing the empty cell issue
    if (onUpdate) {
      try {
        // Always update even if the values are the same
        // This allows adding data to previously empty cells
        const updatedData = {
          [column.id]: value === '' ? null : value
        };
        
        console.log(`Updating field ${column.id} for contact ${row.original.id} to:`, value);
        
        // Send to the backend
        await onUpdate(row.original.id, updatedData);
      } catch (error) {
        console.error('Failed to update cell:', error);
        // Revert to original value on error
        setValue(initialValue);
      }
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
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="cell-input"
        >
          <option value="">-- Select Type --</option>
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
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="cell-input"
        >
          <option value="">-- Select Status --</option>
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
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="cell-input"
        placeholder={`Enter ${column.id}`}
      />
    );
  };

  return (
    <TableCell
      ref={cellRef}
      style={{
        width: cell.column.getSize(),
        flex: `0 0 ${cell.column.getSize()}px`,
      }}
      className={`editable-cell ${isEditing ? 'editing' : ''}`}
    >
      {isEditing ? (
        <div className="cell-input-container">
          {renderInput()}
        </div>
      ) : (
        <div 
          className="editable-cell-display"
          onClick={handleClick}
        >
          {value === null || value === undefined || value === '' ? (
            <span className="cell-empty-placeholder">Click to add {column.id}</span>
          ) : (
            <span className="cell-content">
              {formatDisplayValue(value)}
            </span>
          )}
        </div>
      )}
    </TableCell>
  );
}
