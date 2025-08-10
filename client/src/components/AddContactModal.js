import React, { useState, useEffect } from 'react';
import { useContactPropertyOptions } from '../hooks/useContactPropertyOptions';
import { Save, X } from 'lucide-react';
import '../styles/forms/sideform.css';

/**
 * AddContactModal Component
 * 
 * A modal dialog for adding new contacts to the CRM system.
 * Includes form validation and handles the creation of new contact records.
 * 
 * Props:
 * - isOpen: Boolean indicating if modal should be displayed
 * - onClose: Function called when modal should be closed
 * - onAddContact: Function called with new contact data when form is submitted
 */
const AddContactModal = ({ isOpen, onClose, onAddContact }) => {
  // Form data state - holds all the input values
  const { typeOptions, sourceOptions, statusOptions, isLoading: optionsLoading } = useContactPropertyOptions();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    contactType: '',
    leadSource: '',
    status: ''
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation state for slide-in effect
  const [animationState, setAnimationState] = useState('entering');
  const [shouldRender, setShouldRender] = useState(false);

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure the element is rendered before starting animation
      const timer = setTimeout(() => {
        setAnimationState('entered');
      }, 10);
      return () => clearTimeout(timer);
    } else if (shouldRender) {
      setAnimationState('exiting');
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        setAnimationState('entering');
      }, 300); // Match the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

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
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new contact object with trimmed values
      const newContact = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        suburb: formData.suburb.trim(),
        contactType: formData.contactType,
        leadSource: formData.leadSource.trim(),
        status: formData.status,
        customFields: [], // Initialize empty custom fields array
        tasks: [], // Initialize empty tasks array
        notes: [], // Initialize empty notes array
        activities: [] // Initialize empty activities array
      };

      // Call parent function to add the contact
      await onAddContact(newContact);

      // Reset form and close modal on success
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding contact:', error);
      // You could set an error state here to show user feedback
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      suburb: '',
      contactType: typeOptions[0] || '',
      leadSource: sourceOptions[0] || '',
      status: statusOptions[0] || ''
    });
    setErrors({});
  };

  /**
   * Handle modal close
   * Resets form and triggers exit animation
   */
  const handleClose = () => {
    resetForm();
    setAnimationState('exiting');
    // The actual onClose will be called after animation completes
    setTimeout(() => {
      onClose();
    }, 300);
  };

  /**
   * Handle click on modal overlay (outside modal content)
   * @param {Event} e - Click event
   */
  const handleOverlayClick = (e) => {
    // Only close if clicking the overlay itself, not the modal content
    // Also don't close if we're already animating out
    if (e.target === e.currentTarget && animationState !== 'exiting') {
      handleClose();
    }
  };

  // Don't render anything if modal should not be rendered
  if (!shouldRender && !isOpen) return null;
  if (optionsLoading) return <div>Loading options...</div>;

  return (
    <div className={`modal-overlay ${animationState}`} onClick={handleOverlayClick}>
      <div className={`modal-content ${animationState}`}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Add New Contact</h2>
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
            <label htmlFor="name">
              Name *
              {errors.name && <span className="error-text">{errors.name}</span>}
            </label>
            <input
              id="name"
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
            <label htmlFor="email">
              Email
              {errors.email && <span className="error-text">{errors.email}</span>}
            </label>
            <input
              id="email"
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
            <label htmlFor="phone">
              Phone
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </label>
            <input
              id="phone"
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
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address"
            />
          </div>

          {/* Suburb Field - Optional */}
          <div className="form-group">
            <label htmlFor="suburb">Suburb</label>
            <input
              id="suburb"
              name="suburb"
              type="text"
              value={formData.suburb}
              onChange={handleInputChange}
              placeholder="Enter suburb"
            />
          </div>

          {/* Contact Type Field - Required with default, supports multi-select if needed */}
          <div className="form-group">
            <label htmlFor="contactType">Contact Type</label>
            <select
              id="contactType"
              name="contactType"
              value={formData.contactType}
              onChange={handleInputChange}
            >
              {typeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Lead Source Field - Optional, dropdown */}
          <div className="form-group">
            <label htmlFor="leadSource">Lead Source</label>
            <select
              id="leadSource"
              name="leadSource"
              value={formData.leadSource}
              onChange={handleInputChange}
            >
              {sourceOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="">Other</option>
            </select>
          </div>

          {/* Status Field - Required, dropdown */}
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
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
              {isSubmitting ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;