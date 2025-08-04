import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useUpdatePassword } from '../hooks/useUserSettings';

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  const updatePasswordMutation = useUpdatePassword();

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    if (/[@$!%*?&]/.test(password)) {
      score += 1;
    }

    return { score, feedback };
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else {
      const strength = validatePasswordStrength(formData.newPassword);
      if (strength.score < 4) {
        errors.newPassword = 'Password must meet all requirements';
      }
    }

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
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

    // Update password strength for new password
    if (name === 'newPassword') {
      setPasswordStrength(validatePasswordStrength(value));
    }

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      setSuccessMessage('Password updated successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setValidationErrors({});
      setPasswordStrength({ score: 0, feedback: [] });
    } catch (error) {
      // Handle specific error cases
      const errorMessage = error.message;
      
      if (errorMessage.includes('Current password is incorrect')) {
        setValidationErrors({ currentPassword: 'Current password is incorrect' });
      } else if (errorMessage.includes('do not match')) {
        setValidationErrors({ confirmPassword: 'Passwords do not match' });
      } else if (errorMessage.includes('must be at least 8 characters')) {
        setValidationErrors({ newPassword: 'Password must meet all requirements' });
      } else if (errorMessage.includes('different from current')) {
        setValidationErrors({ newPassword: 'New password must be different from current password' });
      } else {
        setValidationErrors({ general: errorMessage });
      }
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return 'danger';
    if (passwordStrength.score <= 2) return 'warning';
    if (passwordStrength.score <= 3) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 1) return 'Weak';
    if (passwordStrength.score <= 2) return 'Fair';
    if (passwordStrength.score <= 3) return 'Good';
    return 'Strong';
  };

  return (
    <div>
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
            {/* Current Password Input */}
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label">
                Current Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  className={`form-control ${validationErrors.currentPassword ? 'is-invalid' : ''}`}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your current password"
                  disabled={updatePasswordMutation.isPending}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => togglePasswordVisibility('current')}
                  disabled={updatePasswordMutation.isPending}
                >
                  {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {validationErrors.currentPassword && (
                  <div className="invalid-feedback">{validationErrors.currentPassword}</div>
                )}
              </div>
            </div>

            {/* New Password Input */}
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">
                New Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  className={`form-control ${validationErrors.newPassword ? 'is-invalid' : ''}`}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  disabled={updatePasswordMutation.isPending}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => togglePasswordVisibility('new')}
                  disabled={updatePasswordMutation.isPending}
                >
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {validationErrors.newPassword && (
                  <div className="invalid-feedback">{validationErrors.newPassword}</div>
                )}
              </div>

              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="d-flex align-items-center mb-1">
                    <small className="text-muted me-2">Password strength:</small>
                    <span className={`badge bg-${getPasswordStrengthColor()}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="progress" style={{ height: '4px' }}>
                    <div
                      className={`progress-bar bg-${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-1">
                      <small className="text-muted">Missing: {passwordStrength.feedback.join(', ')}</small>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  disabled={updatePasswordMutation.isPending}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => togglePasswordVisibility('confirm')}
                  disabled={updatePasswordMutation.isPending}
                >
                  {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {validationErrors.confirmPassword && (
                  <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock size={16} className="me-2" />
                    Update Password
                  </>
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setValidationErrors({});
                  setSuccessMessage('');
                  setPasswordStrength({ score: 0, feedback: [] });
                }}
                disabled={updatePasswordMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Password Requirements */}
      <div className="mt-4 p-3 bg-light rounded">
        <h6 className="text-muted mb-2">
          <Shield size={16} className="me-1" />
          Password Requirements
        </h6>
        <div className="row">
          <div className="col-md-6">
            <ul className="text-muted small mb-0">
              <li>At least 8 characters long</li>
              <li>One uppercase letter (A-Z)</li>
            </ul>
          </div>
          <div className="col-md-6">
            <ul className="text-muted small mb-0">
              <li>One lowercase letter (a-z)</li>
              <li>One number (0-9)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
