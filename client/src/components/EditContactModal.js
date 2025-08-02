import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

/**
 * EditContactModal Component
 * 
 * A modal dialog for editing existing contacts in the CRM system.
 * Pre-populates form fields with existing contact data and handles updates.
 * 
 * Props:
 * - isOpen: Boolean indicating if modal should be displayed
 * - contact: The contact object to edit (null when closed)
 * - onClose: Function called when modal should be closed
 * - onUpdateContact: Function called with updated contact data when form is submitted
 */
const EditContactModal = ({ isOpen, contact, onClose, onUpdateContact }) => {
  // Form data state - holds all the input values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    contactType: 'LEAD',
    leadSource: '',
    status: 'NEW'
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Populate form with contact data when contact prop changes
   * This runs when a new contact is selected for editing
   */
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        suburb: contact.suburb || '',
        contactType: contact.contactType || 'LEAD',
        leadSource: contact.leadSource || '',
        status: contact.status || 'NEW'
      });
      // Clear any existing errors when loading new contact
      setErrors({});
    }
  }, [contact]);

  /**
   * Handle input field changes
   * Updates the corresponding field in formData state
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Validate form data before submission
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation (if provided)
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (if provided)
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Basic email validation
   * @param {string} email - Email to validate
   * @returns {boolean} True if email format is valid
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Basic phone validation (allows various formats)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if phone format is valid
   */
  const isValidPhone = (phone) => {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    // Accept phone numbers with 10-15 digits
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  /**
   * Check if form has been modified from original contact data
   * @returns {boolean} True if form has changes
   */
  const hasChanges = () => {
    if (!contact) return false;
    
    return (
      formData.name !== (contact.name || '') ||
      formData.email !== (contact.email || '') ||
      formData.phone !== (contact.phone || '') ||
      formData.address !== (contact.address || '') ||
      formData.suburb !== (contact.suburb || '') ||
      formData.contactType !== (contact.contactType || 'LEAD') ||
      formData.leadSource !== (contact.leadSource || '') ||
      formData.status !== (contact.status || 'NEW')
    );
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;

    // Check if there are actually changes to save
    if (!hasChanges()) {
      handleClose();
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create updated contact object with trimmed values
      const updatedContact = {
        ...contact, // Preserve existing data like ID, customFields, etc.
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        suburb: formData.suburb.trim(),
        contactType: formData.contactType,
        leadSource: formData.leadSource.trim(),
        status: formData.status
      };

      // Call parent function to update the contact
      await onUpdateContact(updatedContact);

      // Close modal on success
      handleClose();
    } catch (error) {
      console.error('Error updating contact:', error);
      // You could set an error state here to show user feedback
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to original contact data
   */
  const resetForm = () => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        status: contact.status || 'NEW'
      });
    }
    setErrors({});
  };

  /**
   * Handle modal close
   * Resets form and calls parent close function
   */
  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  /**
   * Handle click on modal overlay (outside modal content)
   * @param {Event} e - Click event
   */
  const handleOverlayClick = (e) => {
    // Only close if clicking the overlay itself, not the modal content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  /**
   * Handle cancel button click
   * Asks for confirmation if there are unsaved changes
   */
  const handleCancel = () => {
    if (hasChanges()) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmClose) return;
    }
    handleClose();
  };

  // Don't render anything if modal is not open or no contact selected
  if (!isOpen || !contact) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Edit Contact</h2>
          <button 
            onClick={handleClose} 
            className="modal-close-button"
            type="button"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="contact-form">
          {/* Name Field - Required */}
          <div className="form-group">
            <label htmlFor="edit-name">
              Name *
              {errors.name && <span className="error-text">{errors.name}</span>}
            </label>
            <input
              id="edit-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter contact name"
              autoFocus
            />
          </div>

          {/* Email Field - Optional */}
          <div className="form-group">
            <label htmlFor="edit-email">
              Email
              {errors.email && <span className="error-text">{errors.email}</span>}
            </label>
            <input
              id="edit-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter email address"
            />
          </div>

          {/* Phone Field - Optional */}
          <div className="form-group">
            <label htmlFor="edit-phone">
              Phone
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </label>
            <input
              id="edit-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className={errors.phone ? 'error' : ''}
              placeholder="Enter phone number"
            />
          </div>

          {/* Address Field - Optional */}
          <div className="form-group">
            <label htmlFor="edit-address">Address</label>
            <input
              id="edit-address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address"
            />
          </div>

          {/* Suburb Field - Optional */}
          <div className="form-group">
            <label htmlFor="edit-suburb">Suburb</label>
            <input
              id="edit-suburb"
              name="suburb"
              type="text"
              value={formData.suburb}
              onChange={handleInputChange}
              placeholder="Enter suburb"
            />
          </div>

          {/* Contact Type Field - Required with default */}
          <div className="form-group">
            <label htmlFor="edit-contactType">Contact Type</label>
            <select
              id="edit-contactType"
              name="contactType"
              value={formData.contactType}
              onChange={handleInputChange}
            >
              <option value="LEAD">Lead</option>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
              <option value="PAST_CLIENT">Past Client</option>
            </select>
          </div>

          {/* Lead Source Field - Optional */}
          <div className="form-group">
            <label htmlFor="edit-leadSource">Lead Source</label>
            <input
              id="edit-leadSource"
              name="leadSource"
              type="text"
              value={formData.leadSource}
              onChange={handleInputChange}
              placeholder="Enter lead source (e.g., Website, Referral, Advertisement)"
            />
          </div>

          {/* Status Field - Required */}
          <div className="form-group">
            <label htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="CLOSED_WON">Closed Won</option>
              <option value="CLOSED_LOST">Closed Lost</option>
            </select>
          </div>

          {/* Show unsaved changes indicator */}
          {hasChanges() && (
            <div className="unsaved-changes-indicator">
              <p style={{ color: '#f59e0b', fontSize: '14px', margin: '10px 0' }}>
                You have unsaved changes
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            {/* Reset button to revert changes */}
            {hasChanges() && (
              <button 
                type="button" 
                onClick={resetForm} 
                className="reset-button"
                disabled={isSubmitting}
              >
                Reset
              </button>
            )}
            
            <button 
              type="submit" 
              className="save-button"
              disabled={isSubmitting || !hasChanges()}
            >
              <Save size={16} style={{ marginRight: 4 }} />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContactModal;