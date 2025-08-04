import React, { useState } from 'react';
import { Mail, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useUpdateEmail } from '../hooks/useUserSettings';

const ChangeEmailForm = ({ currentEmail }) => {
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const updateEmailMutation = useUpdateEmail();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (formData.email.toLowerCase().trim() === currentEmail?.toLowerCase()) {
      errors.email = 'New email must be different from current email';
    }

    if (!formData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateEmailMutation.mutateAsync({
        email: formData.email.trim(),
        currentPassword: formData.currentPassword
      });

      setSuccessMessage('Email address updated successfully!');
      setFormData({
        email: '',
        currentPassword: ''
      });
      setValidationErrors({});
    } catch (error) {
      // Handle specific error cases
      const errorMessage = error.message;
      
      if (errorMessage.includes('Current password is incorrect')) {
        setValidationErrors({ currentPassword: 'Current password is incorrect' });
      } else if (errorMessage.includes('Email address is already in use')) {
        setValidationErrors({ email: 'This email address is already in use' });
      } else if (errorMessage.includes('valid email')) {
        setValidationErrors({ email: 'Please enter a valid email address' });
      } else {
        setValidationErrors({ general: errorMessage });
      }
    }
  };

  return (
    <div>
      {/* Current Email Display */}
      <div className="alert alert-info d-flex align-items-center mb-4">
        <Mail size={20} className="me-2" />
        <div>
          <strong>Current Email:</strong> {currentEmail}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success d-flex align-items-center mb-4">
          <CheckCircle size={20} className="me-2" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* General Error */}
      {validationErrors.general && (
        <div className="alert alert-danger d-flex align-items-center mb-4">
          <AlertCircle size={20} className="me-2" />
          <div>{validationErrors.general}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-8">
            {/* New Email Input */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                New Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your new email address"
                disabled={updateEmailMutation.isPending}
              />
              {validationErrors.email && (
                <div className="invalid-feedback">{validationErrors.email}</div>
              )}
            </div>

            {/* Current Password Input */}
            <div className="mb-4">
              <label htmlFor="currentPassword" className="form-label">
                Current Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${validationErrors.currentPassword ? 'is-invalid' : ''}`}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your current password"
                  disabled={updateEmailMutation.isPending}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={updateEmailMutation.isPending}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {validationErrors.currentPassword && (
                  <div className="invalid-feedback">{validationErrors.currentPassword}</div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateEmailMutation.isPending}
              >
                {updateEmailMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <Mail size={16} className="me-2" />
                    Update Email
                  </>
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFormData({ email: '', currentPassword: '' });
                  setValidationErrors({});
                  setSuccessMessage('');
                }}
                disabled={updateEmailMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-light rounded">
        <h6 className="text-muted mb-2">Security Notice</h6>
        <p className="text-muted small mb-0">
          For security purposes, we require your current password to change your email address. 
          Make sure to update your email in any applications or services that use your old email address.
        </p>
      </div>
    </div>
  );
};

export default ChangeEmailForm;
