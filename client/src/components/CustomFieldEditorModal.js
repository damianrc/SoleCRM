import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';

/**
 * CustomFieldEditorModal Component
 * 
 * A modal dialog for creating and editing custom fields for contacts.
 * Supports different field types (text, select, number, date) and 
 * manages options for select fields.
 * 
 * Props:
 * - isOpen: Boolean indicating if modal should be displayed
 * - contactId: ID of the contact this custom field belongs to
 * - field: Existing field object to edit (null for new field)
 * - onClose: Function called when modal should be closed
 * - onSaveField: Function called with field data when form is submitted
 * - onDeleteField: Function called when field is deleted (for existing fields)
 */
const CustomFieldEditorModal = ({ 
  isOpen, 
  contactId, 
  field, 
  onClose, 
  onSaveField, 
  onDeleteField 
}) => {
  // Form data state for the custom field
  const [formData, setFormData] = useState({
    name: '',
    type: 'text', // Default field type
    options: [], // For select type fields
    required: false,
    value: '' // Current value of the field
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Supported field types
  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'checkbox', label: 'Checkbox' }
  ];

  /**
   * Populate form with field data when field prop changes
   * This runs when editing an existing field or creating a new one
   */
  useEffect(() => {
    if (field) {
      // Editing existing field
      setFormData({
        name: field.fieldName || '',
        type: field.fieldType || 'text',
        options: field.fieldOptions || [],
        required: field.required || false,
        value: field.value || ''
      });
    } else {
      // Creating new field
      setFormData({
        name: '',
        type: 'text',
        options: [],
        required: false,
        value: ''
      });
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [field, isOpen]);

  /**
   * Handle input field changes
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Reset options when changing field type away from select
    if (name === 'type' && value !== 'select') {
      setFormData(prev => ({
        ...prev,
        options: []
      }));
    }
  };

  /**
   * Add a new option for select field type
   */
  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  /**
   * Update an option value at specific index
   * @param {number} index - Index of option to update
   * @param {string} value - New option value
   */
  const handleOptionChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? value : option
      )
    }));
  };

  /**
   * Remove an option at specific index
   * @param {number} index - Index of option to remove
   */
  const handleRemoveOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  /**
   * Validate form data before submission
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // Field name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Field name is required';
    }

    // Check for duplicate field names (you might want to pass existing fields to check)
    // This would require additional props to check against existing fields

    // Select type must have at least one option
    if (formData.type === 'select' && formData.options.length === 0) {
      newErrors.options = 'Select fields must have at least one option';
    }

    // Select type options cannot be empty
    if (formData.type === 'select') {
      const hasEmptyOptions = formData.options.some(option => !option.trim());
      if (hasEmptyOptions) {
        newErrors.options = 'All options must have a value';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create field object in the format expected by the system
      const fieldData = {
        id: field?.id || Date.now(), // Use existing ID or generate new one
        fieldName: formData.name.trim(),
        fieldType: formData.type,
        fieldOptions: formData.type === 'select' ? 
          formData.options.filter(opt => opt.trim()) : [], // Remove empty options
        required: formData.required,
        value: formData.value
      };

      // Call parent save function
      await onSaveField(contactId, fieldData, !!field);

      // Close modal on success
      handleClose();
    } catch (error) {
      console.error('Error saving custom field:', error);
      // You could set an error state here to show user feedback
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle field deletion
   */
  const handleDelete = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onDeleteField(contactId, field.id);
      handleClose();
    } catch (error) {
      console.error('Error deleting custom field:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  /**
   * Handle click on modal overlay
   * @param {Event} e - Click event
   */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Modal Header */}
        <div className="modal-header">
          <h2>{field ? 'Edit Custom Field' : 'Add Custom Field'}</h2>
          <button 
            onClick={handleClose} 
            className="modal-close-button"
            type="button"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Custom Field Form */}
        <form onSubmit={handleSubmit} className="custom-field-form">
          {/* Field Name */}
          <div className="form-group">
            <label htmlFor="field-name">
              Field Name *
              {errors.name && <span className="error-text">{errors.name}</span>}
            </label>
            <input
              id="field-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter field name"
              autoFocus
            />
          </div>

          {/* Field Type */}
          <div className="form-group">
            <label htmlFor="field-type">Field Type</label>
            <select
              id="field-type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              {fieldTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Options for Select Field Type */}
          {formData.type === 'select' && (
            <div className="form-group">
              <label>
                Options *
                {errors.options && <span className="error-text">{errors.options}</span>}
              </label>
              <div className="options-list">
                {formData.options.map((option, index) => (
                  <div key={index} className="option-item">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="option-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="remove-option-button"
                      title="Remove option"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="add-option-button"
                >
                  <Plus size={16} /> Add Option
                </button>
              </div>
            </div>
          )}

          {/* Required Field Checkbox */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="required"
                checked={formData.required}
                onChange={handleInputChange}
              />
              <span>Required field</span>
            </label>
          </div>

          {/* Current Value (for existing fields) */}
          {field && (
            <div className="form-group">
              <label htmlFor="field-value">Current Value</label>
              {formData.type === 'select' ? (
                <select
                  id="field-value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                >
                  <option value="">-- Select Value --</option>
                  {formData.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : formData.type === 'checkbox' ? (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="value"
                    checked={formData.value === 'true'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      value: e.target.checked ? 'true' : 'false'
                    }))}
                  />
                  <span>Checked</span>
                </label>
              ) : formData.type === 'textarea' ? (
                <textarea
                  id="field-value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  rows={3}
                />
              ) : (
                <input
                  id="field-value"
                  name="value"
                  type={formData.type === 'number' ? 'number' : 
                        formData.type === 'date' ? 'date' : 
                        formData.type === 'email' ? 'email' : 'text'}
                  value={formData.value}
                  onChange={handleInputChange}
                />
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            {/* Delete Button (for existing fields) */}
            {field && (
              <div className="delete-section">
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="delete-button"
                    disabled={isSubmitting}
                  >
                    <Trash2 size={16} /> Delete Field
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p>Are you sure you want to delete this field?</p>
                    <div className="delete-confirm-actions">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="cancel-button"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="delete-confirm-button"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Actions */}
            <div className="main-actions">
              <button 
                type="button" 
                onClick={handleClose} 
                className="cancel-button"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-button"
                disabled={isSubmitting}
              >
                <Save size={16} style={{ marginRight: 4 }} />
                {isSubmitting ? 'Saving...' : (field ? 'Update Field' : 'Create Field')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomFieldEditorModal;