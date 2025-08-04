import React from 'react';
import { Button } from './Button';

const BulkDeleteModal = ({ selectedCount, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete {selectedCount} selected contacts?</p>
      <div className="modal-actions">
        <Button onClick={onCancel} variant="outline">Cancel</Button>
        <Button onClick={onConfirm} variant="destructive">Delete</Button>
      </div>
    </div>
  </div>
);

export { BulkDeleteModal };
