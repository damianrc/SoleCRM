import React, { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';
import './PopupForms.css';

const NoteForm = ({ contactId, onSubmit, onCancel, onDelete, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationError) {
      setValidationError('');
    }
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setValidationError('Note title is required');
      setError('');
      return;
    }
    
    if (!formData.content.trim()) {
      setValidationError('Note content is required');
      setError('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setValidationError('');

    try {
      let response;
      
      if (isEditing && initialData) {
        // Update existing note
        response = await authenticatedFetch(`/api/contacts/${contactId}/notes/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formData.title.trim(),
            content: formData.content.trim()
          })
        });
      } else {
        // Create new note
        response = await authenticatedFetch(`/api/contacts/${contactId}/notes`, {
          method: 'POST',
          body: JSON.stringify({
            title: formData.title.trim(),
            content: formData.content.trim()
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} note`);
      }

      const noteResult = await response.json();
      
      // Call the callback to update the parent component
      if (onSubmit) {
        if (isEditing) {
          onSubmit(initialData.id, noteResult);
        } else {
          onSubmit(noteResult);
        }
      }
      
      // Reset form only if creating new note
      if (!isEditing) {
        setFormData({
          title: '',
          content: ''
        });
      }
      
      // Close the popup
      onCancel();
      
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} note:`, err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} note. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !initialData) return;
    
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authenticatedFetch(`/api/contacts/${contactId}/notes/${initialData.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }

      if (onDelete) {
        onDelete(initialData.id);
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
        <div className="form-error">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="title">Note Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter note title"
          required
          autoFocus
        />
      </div>
      
      <div className="form-group description-group">
        <label htmlFor="content">Note Content *</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Enter your note content here..."
          required
        />
      </div>

      <div className="form-actions">
        <div className="form-validation-text">
          {validationError}
        </div>
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
