import React, { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';
import '../../styles/forms/Popupform.css';

const TaskForm = ({ contactId, onSubmit, onCancel, onDelete, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'MEDIUM',
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (isSubmitting) {
      return;
    }
    
    if (!formData.title.trim()) {
      setValidationError('Task title is required');
      setError('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setValidationError('');

    try {
      let response;
      
      if (isEditing && initialData) {
        // Update existing task
        response = await authenticatedFetch(`/api/contacts/${contactId}/tasks/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            priority: formData.priority,
            dueDate: formData.dueDate || null
          })
        });
      } else {
        // Create new task
        response = await authenticatedFetch(`/api/contacts/${contactId}/tasks`, {
          method: 'POST',
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            priority: formData.priority,
            dueDate: formData.dueDate || null
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} task`);
      }

      const taskResult = await response.json();
      
      // Call the callback to update the parent component
      if (onSubmit) {
        if (isEditing) {
          onSubmit(initialData.id, taskResult);
        } else {
          onSubmit(taskResult);
        }
      }
      // Close the popup immediately after successful submit
      onCancel();
      // Reset form only if creating new task
      if (!isEditing) {
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: ''
        });
      }
      
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} task:`, err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} task. Please try again.`);
    } finally {
      setIsSubmitting(false);
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
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task. Please try again.');
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
        <div className="form-group wide">
          <label htmlFor="title">Task Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter task title"
            required
            autoFocus
          />
        </div>

        <div className="form-group narrow">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div className="form-group narrow">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
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
          placeholder="Enter task description (optional)"
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
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Task' : 'Create Task')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
