import React, { useState, useRef } from 'react';
import { authenticatedFetch } from '../../utils/auth';
import '../../styles/forms/Popupform.css';

const ActivityForm = ({ contactId, onSubmit, onCancel, onDelete, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'CALL',
    title: initialData?.title || '',
    description: initialData?.description || ''
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
    
    // Prevent duplicate submissions
    if (isSubmitting || submissionRef.current) {
      return;
    }
    
    if (!formData.title.trim()) {
      setValidationError('Activity title is required');
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
        // Update existing activity
        response = await authenticatedFetch(`/api/contacts/${contactId}/activities/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            type: formData.type,
            title: formData.title.trim(),
            description: formData.description.trim() || null
          })
        });
      } else {
        // Create new activity
        response = await authenticatedFetch(`/api/contacts/${contactId}/activities`, {
          method: 'POST',
          body: JSON.stringify({
            type: formData.type,
            title: formData.title.trim(),
            description: formData.description.trim() || null
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} activity`);
      }

      const activityResult = await response.json();
      
      // Call the onSubmit callback with the result
      if (onSubmit) {
        if (isEditing) {
          onSubmit(initialData.id, activityResult);
        } else {
          onSubmit(activityResult);
        }
      }
      // Close the popup immediately after successful submit
      onCancel();
      // Reset form only if creating new activity
      if (!isEditing) {
        setFormData({
          type: 'CALL',
          title: '',
          description: ''
        });
      }
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} activity:`, err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} activity. Please try again.`);
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
      console.error('Error deleting activity:', err);
      setError(err.message || 'Failed to delete activity. Please try again.');
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
      
      <div className="form-row">
        <div className="form-group narrow">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="CALL">Call</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="MEETING">Meeting</option>
            <option value="NOTE">Note</option>
          </select>
        </div>

        <div className="form-group wide">
          <label htmlFor="title">Activity Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter activity title"
            autoFocus
          />
        </div>
      </div>

      <div className="form-group description-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter activity description (optional)"
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
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Activity' : 'Create Activity')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ActivityForm;