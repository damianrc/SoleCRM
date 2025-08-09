import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useUpdateEmail, useUpdatePassword } from '../hooks/useUserSettings';

const AccountSettings = ({ user }) => {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const updateEmailMutation = useUpdateEmail();
  const updatePasswordMutation = useUpdatePassword();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    if (!email.includes('@')) {
      setEmailError('Invalid email address');
      return;
    }
    setEmailError('');
    try {
      await updateEmailMutation.mutateAsync(email);
      setSuccessMessage('Email updated successfully');
    } catch (error) {
      setErrorMessage('Failed to update email');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    try {
      await updatePasswordMutation.mutateAsync({ password, newPassword });
      setSuccessMessage('Password updated successfully');
    } catch (error) {
      setErrorMessage('Failed to update password');
    }
  };

  return (
    <div>
      {/* Email Update Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <Mail size={20} className="me-2" />
            Change Email Address
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleEmailUpdate}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                New Email Address
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={handleEmailChange}
                required
              />
              {emailError && <div className="text-danger">{emailError}</div>}
            </div>
            <button type="submit" className="btn btn-primary">
              Update Email
            </button>
            {successMessage && <div className="text-success mt-2">{successMessage}</div>}
            {errorMessage && <div className="text-danger mt-2">{errorMessage}</div>}
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
          <form onSubmit={handlePasswordUpdate}>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Current Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <input
                type="password"
                className="form-control"
                id="newPassword"
                value={newPassword}
                onChange={handleNewPasswordChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
              />
              {passwordError && <div className="text-danger">{passwordError}</div>}
            </div>
            <button type="submit" className="btn btn-primary">
              Update Password
            </button>
            {successMessage && <div className="text-success mt-2">{successMessage}</div>}
            {errorMessage && <div className="text-danger mt-2">{errorMessage}</div>}
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
  );
};

export default AccountSettings;
