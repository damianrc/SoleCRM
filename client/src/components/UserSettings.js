import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield, Camera, X } from 'lucide-react';
import { useUserProfile, useUpdateEmail, useUpdatePassword, useUpdateDisplayName, useUpdateProfileImage } from '../hooks/useUserSettings';
import { generateInitials } from '../utils/userUtils';
import './UserSettings.css';

const UserSettings = () => {
  // Form states
  const [emailForm, setEmailForm] = useState({
    email: '',
    currentPassword: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [displayNameForm, setDisplayNameForm] = useState({
    displayName: ''
  });

  // UI states
  const [showPasswords, setShowPasswords] = useState({
    emailCurrent: false,
    passwordCurrent: false,
    passwordNew: false,
    passwordConfirm: false
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessages, setSuccessMessages] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  // Hooks
  const { data: userProfile, isLoading, error } = useUserProfile();
  const updateEmailMutation = useUpdateEmail();
  const updatePasswordMutation = useUpdatePassword();
  const updateDisplayNameMutation = useUpdateDisplayName();
  const updateProfileImageMutation = useUpdateProfileImage();

  const user = userProfile?.user;

  // Initialize display name when user data loads
  React.useEffect(() => {
    if (user?.displayName) {
      setDisplayNameForm({ displayName: user.displayName });
    }
  }, [user]);

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('One lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('One uppercase letter');

    if (/\d/.test(password)) score += 1;
    else feedback.push('One number');

    if (/[@$!%*?&]/.test(password)) score += 1;

    return { score, feedback };
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Clear messages
  const clearMessages = (section) => {
    setValidationErrors(prev => ({
      ...prev,
      [`${section}General`]: undefined
    }));
    setSuccessMessages(prev => ({
      ...prev,
      [section]: undefined
    }));
  };

  // Handle input changes
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({ ...prev, [name]: value }));
    clearMessages('email');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      setPasswordStrength(validatePasswordStrength(value));
    }
    clearMessages('password');
  };

  const handleDisplayNameChange = (e) => {
    const { value } = e.target;
    setDisplayNameForm({ displayName: value });
    clearMessages('displayName');
  };

  // Profile image handlers
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|bmp|webp)$/)) {
      setValidationErrors(prev => ({
        ...prev,
        profileImageGeneral: 'Please select a valid image file (JPEG, PNG, GIF, BMP, or WebP).'
      }));
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setValidationErrors(prev => ({
        ...prev,
        profileImageGeneral: 'Image size must be less than 2MB.'
      }));
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      handleProfileImageUpdate(base64String);
    };
    reader.onerror = () => {
      setValidationErrors(prev => ({
        ...prev,
        profileImageGeneral: 'Error reading image file.'
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageUpdate = async (profileImage) => {
    clearMessages('profileImage');
    
    try {
      await updateProfileImageMutation.mutateAsync({ profileImage });
      setSuccessMessages(prev => ({
        ...prev,
        profileImage: 'Profile image updated successfully!'
      }));
    } catch (error) {
      setValidationErrors(prev => ({
        ...prev,
        profileImageGeneral: error.message
      }));
    }
  };

  const handleRemoveProfileImage = async () => {
    clearMessages('profileImage');
    
    try {
      await updateProfileImageMutation.mutateAsync({ profileImage: null });
      setSuccessMessages(prev => ({
        ...prev,
        profileImage: 'Profile image removed successfully!'
      }));
    } catch (error) {
      setValidationErrors(prev => ({
        ...prev,
        profileImageGeneral: error.message
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Submit handlers
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (updateEmailMutation.isPending) {
      return;
    }
    
    const errors = {};
    if (!emailForm.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(emailForm.email)) errors.email = 'Invalid email format';
    else if (emailForm.email.toLowerCase() === user?.email?.toLowerCase()) errors.email = 'New email must be different';
    
    if (!emailForm.currentPassword.trim()) errors.emailCurrentPassword = 'Current password is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    try {
      await updateEmailMutation.mutateAsync({
        email: emailForm.email.trim(),
        currentPassword: emailForm.currentPassword
      });
      
      setSuccessMessages(prev => ({ ...prev, email: 'Email updated successfully!' }));
      setEmailForm({ email: '', currentPassword: '' });
      setValidationErrors({});
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.includes('Current password is incorrect')) {
        setValidationErrors(prev => ({ ...prev, emailCurrentPassword: 'Current password is incorrect' }));
      } else if (errorMessage.includes('already in use')) {
        setValidationErrors(prev => ({ ...prev, email: 'This email address is already in use' }));
      } else {
        setValidationErrors(prev => ({ ...prev, emailGeneral: errorMessage }));
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (updatePasswordMutation.isPending) {
      return;
    }
    
    const errors = {};
    if (!passwordForm.currentPassword.trim()) errors.passwordCurrentPassword = 'Current password is required';
    if (!passwordForm.newPassword.trim()) errors.newPassword = 'New password is required';
    else if (passwordStrength.score < 4) errors.newPassword = 'Password must meet all requirements';
    if (!passwordForm.confirmPassword.trim()) errors.confirmPassword = 'Please confirm your password';
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (passwordForm.currentPassword === passwordForm.newPassword) errors.newPassword = 'New password must be different';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      setSuccessMessages(prev => ({ ...prev, password: 'Password updated successfully!' }));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setValidationErrors({});
      setPasswordStrength({ score: 0, feedback: [] });
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.includes('Current password is incorrect')) {
        setValidationErrors(prev => ({ ...prev, passwordCurrentPassword: 'Current password is incorrect' }));
      } else {
        setValidationErrors(prev => ({ ...prev, passwordGeneral: errorMessage }));
      }
    }
  };

  const handleDisplayNameSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (updateDisplayNameMutation.isPending) {
      return;
    }
    
    try {
      await updateDisplayNameMutation.mutateAsync({
        displayName: displayNameForm.displayName.trim() || null
      });
      
      setSuccessMessages(prev => ({ ...prev, displayName: 'Display name updated successfully!' }));
    } catch (error) {
      setValidationErrors(prev => ({ ...prev, displayNameGeneral: error.message }));
    }
  };

  // Password strength indicator helpers
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

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <AlertCircle size={20} className="me-2" />
              <div>
                Failed to load user settings: {error.message}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="d-flex align-items-center mb-4">
            <User size={28} className="text-primary me-3" />
            <div>
              <h2 className="mb-1">User Settings</h2>
              <p className="text-muted mb-0">Manage your account information and security</p>
            </div>
          </div>

          {/* Current Profile Info */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <User size={20} className="me-2" />
                Current Profile
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label text-muted">Profile Picture</label>
                    <div className="d-flex align-items-center">
                      <div className="profile-avatar-preview me-3">
                        {user?.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt="Profile" 
                            className="profile-image-full"
                          />
                        ) : (
                          <div className="profile-initials">
                            {generateInitials(user)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label text-muted">Email Address</label>
                    <div className="form-control-plaintext">{user?.email}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label text-muted">Display Name</label>
                    <div className="form-control-plaintext">{user?.displayName || 'Not set'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Image Section */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <Camera size={20} className="me-2" />
                Profile Picture
              </h5>
            </div>
            <div className="card-body">
              {successMessages.profileImage && (
                <div className="alert alert-success d-flex align-items-center mb-3">
                  <CheckCircle size={20} className="me-2" />
                  <div>{successMessages.profileImage}</div>
                </div>
              )}
              
              {validationErrors.profileImageGeneral && (
                <div className="alert alert-danger d-flex align-items-center mb-3">
                  <AlertCircle size={20} className="me-2" />
                  <div>{validationErrors.profileImageGeneral}</div>
                </div>
              )}

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Upload New Picture</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={updateProfileImageMutation.isPending}
                    />
                    <div className="form-text">
                      Supported formats: JPEG, PNG, GIF, BMP, WebP (max 2MB)
                    </div>
                  </div>
                  
                  {user?.profileImage && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={handleRemoveProfileImage}
                      disabled={updateProfileImageMutation.isPending}
                    >
                      {updateProfileImageMutation.isPending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Removing...
                        </>
                      ) : (
                        <>
                          <X size={16} className="me-2" />
                          Remove Picture
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Current Picture</label>
                    <div className="profile-image-container">
                      <div className="profile-avatar-large">
                        {user?.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt="Profile" 
                            className="profile-image-large"
                          />
                        ) : (
                          <div className="profile-initials-large">
                            {generateInitials(user)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <User size={20} className="me-2" />
                Update Display Name
              </h5>
            </div>
            <div className="card-body">
              {successMessages.displayName && (
                <div className="alert alert-success d-flex align-items-center mb-3">
                  <CheckCircle size={20} className="me-2" />
                  <div>{successMessages.displayName}</div>
                </div>
              )}
              
              {validationErrors.displayNameGeneral && (
                <div className="alert alert-danger d-flex align-items-center mb-3">
                  <AlertCircle size={20} className="me-2" />
                  <div>{validationErrors.displayNameGeneral}</div>
                </div>
              )}

              <form onSubmit={handleDisplayNameSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="displayName" className="form-label">Display Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="displayName"
                        value={displayNameForm.displayName}
                        onChange={handleDisplayNameChange}
                        placeholder="Enter your display name"
                        disabled={updateDisplayNameMutation.isPending}
                      />
                      <div className="form-text">Leave empty to remove display name</div>
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={updateDisplayNameMutation.isPending}
                    >
                      {updateDisplayNameMutation.isPending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <User size={16} className="me-2" />
                          Update Display Name
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Email Update Section */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <Mail size={20} className="me-2" />
                Change Email Address
              </h5>
            </div>
            <div className="card-body">
              {successMessages.email && (
                <div className="alert alert-success d-flex align-items-center mb-3">
                  <CheckCircle size={20} className="me-2" />
                  <div>{successMessages.email}</div>
                </div>
              )}
              
              {validationErrors.emailGeneral && (
                <div className="alert alert-danger d-flex align-items-center mb-3">
                  <AlertCircle size={20} className="me-2" />
                  <div>{validationErrors.emailGeneral}</div>
                </div>
              )}

              <form onSubmit={handleEmailSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="newEmail" className="form-label">
                        New Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                        id="newEmail"
                        name="email"
                        value={emailForm.email}
                        onChange={handleEmailChange}
                        placeholder="Enter your new email address"
                        disabled={updateEmailMutation.isPending}
                      />
                      {validationErrors.email && (
                        <div className="invalid-feedback">{validationErrors.email}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="emailCurrentPassword" className="form-label">
                        Current Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPasswords.emailCurrent ? 'text' : 'password'}
                          className={`form-control ${validationErrors.emailCurrentPassword ? 'is-invalid' : ''}`}
                          id="emailCurrentPassword"
                          name="currentPassword"
                          value={emailForm.currentPassword}
                          onChange={handleEmailChange}
                          placeholder="Enter your current password"
                          disabled={updateEmailMutation.isPending}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => togglePasswordVisibility('emailCurrent')}
                          disabled={updateEmailMutation.isPending}
                        >
                          {showPasswords.emailCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {validationErrors.emailCurrentPassword && (
                          <div className="invalid-feedback">{validationErrors.emailCurrentPassword}</div>
                        )}
                      </div>
                    </div>

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
                          setEmailForm({ email: '', currentPassword: '' });
                          setValidationErrors({});
                          setSuccessMessages(prev => ({ ...prev, email: undefined }));
                        }}
                        disabled={updateEmailMutation.isPending}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Password Update Section */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <Lock size={20} className="me-2" />
                Change Password
              </h5>
            </div>
            <div className="card-body">
              {successMessages.password && (
                <div className="alert alert-success d-flex align-items-center mb-3">
                  <CheckCircle size={20} className="me-2" />
                  <div>{successMessages.password}</div>
                </div>
              )}
              
              {validationErrors.passwordGeneral && (
                <div className="alert alert-danger d-flex align-items-center mb-3">
                  <AlertCircle size={20} className="me-2" />
                  <div>{validationErrors.passwordGeneral}</div>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="passwordCurrentPassword" className="form-label">
                        Current Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPasswords.passwordCurrent ? 'text' : 'password'}
                          className={`form-control ${validationErrors.passwordCurrentPassword ? 'is-invalid' : ''}`}
                          id="passwordCurrentPassword"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter your current password"
                          disabled={updatePasswordMutation.isPending}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => togglePasswordVisibility('passwordCurrent')}
                          disabled={updatePasswordMutation.isPending}
                        >
                          {showPasswords.passwordCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {validationErrors.passwordCurrentPassword && (
                          <div className="invalid-feedback">{validationErrors.passwordCurrentPassword}</div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">
                        New Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPasswords.passwordNew ? 'text' : 'password'}
                          className={`form-control ${validationErrors.newPassword ? 'is-invalid' : ''}`}
                          id="newPassword"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter your new password"
                          disabled={updatePasswordMutation.isPending}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => togglePasswordVisibility('passwordNew')}
                          disabled={updatePasswordMutation.isPending}
                        >
                          {showPasswords.passwordNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {validationErrors.newPassword && (
                          <div className="invalid-feedback">{validationErrors.newPassword}</div>
                        )}
                      </div>

                      {passwordForm.newPassword && (
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

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm New Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPasswords.passwordConfirm ? 'text' : 'password'}
                          className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm your new password"
                          disabled={updatePasswordMutation.isPending}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => togglePasswordVisibility('passwordConfirm')}
                          disabled={updatePasswordMutation.isPending}
                        >
                          {showPasswords.passwordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {validationErrors.confirmPassword && (
                          <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                        )}
                      </div>
                    </div>

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
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setValidationErrors({});
                          setSuccessMessages(prev => ({ ...prev, password: undefined }));
                          setPasswordStrength({ score: 0, feedback: [] });
                        }}
                        disabled={updatePasswordMutation.isPending}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="card">
            <div className="card-body">
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
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
