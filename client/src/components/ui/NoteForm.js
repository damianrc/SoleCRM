import React, { useState, useRef } from 'react';
import { authenticatedFetch } from '../../utils/auth';
import './PopupForms.css';

const NoteForm = ({ contactId, onSubmit, onCancel, onDelete, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    content: initialData?.content || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const submissionRef = useRef(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (validationError) setValidationError('');
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submissionRef.current) return;
    if (!formData.content.trim()) {
      setValidationError('Note content is required');
      setError('');
      return;
    }
    setIsSubmitting(true);
    submissionRef.current = true;
    setError('');
    setValidationError('');
    try {
      let response;
      if (isEditing && initialData) {
        response = await authenticatedFetch(`/api/contacts/${contactId}/notes/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            content: formData.content.trim()
          })
        });
      } else {
        response = await authenticatedFetch(`/api/contacts/${contactId}/notes`, {
          method: 'POST',
          body: JSON.stringify({
            content: formData.content.trim()
          })
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} note`);
      }
      const noteResult = await response.json();
      if (onSubmit) {
        if (isEditing) {
          onSubmit(initialData.id, noteResult);
        } else {
          onSubmit(noteResult);
        }
      }
      onCancel();
      if (!isEditing) {
        setFormData({ content: '' });
      }
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} note:`, err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} note. Please try again.`);
    } finally {
      setIsSubmitting(false);
      submissionRef.current = false;
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !initialData) return;
    try {
      setIsSubmitting(true);
      if (onDelete) {
        await onDelete(initialData.id);
      }
      onCancel();
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err.message || 'Failed to delete note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="popup-form">
      {error && (
        <div className="form-error">{error}</div>
      )}
      <div className="form-group description-group">
        <label htmlFor="content">Note *</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Enter your note here..."
          required
        />
      </div>
      <div className="form-actions">
        <div className="form-validation-text">{validationError}</div>
        <div className="form-actions-buttons">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Note' : 'Create Note')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default NoteForm;
