import React, { useState, useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { useUpdateDisplayName, useUpdateProfileImage } from '../hooks/useUserSettings';
import { generateInitials } from '../utils/userUtils';

const MAX_LENGTH = 50;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const ProfileSettings = ({ user }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef();

  const updateDisplayNameMutation = useUpdateDisplayName();
  const updateProfileImageMutation = useUpdateProfileImage();

  // Handle display name/job title form submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');
    let newErrors = {};
    if (displayName.length > MAX_LENGTH) newErrors.displayName = 'Max 50 characters';
    if (jobTitle.length > MAX_LENGTH) newErrors.jobTitle = 'Max 50 characters';
    if (Object.keys(newErrors).length) return setErrors(newErrors);
    try {
      await updateDisplayNameMutation.mutateAsync({ displayName, jobTitle });
      setSuccess('Profile updated!');
    } catch (err) {
      setErrors({ form: err.message || 'Update failed' });
    }
  };

  // Handle image file selection
  const handleImageChange = async (e) => {
    setErrors({});
    setSuccess('');
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors({ image: 'File must be an image' });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors({ image: 'Image must be under 2MB' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setImagePreview(base64);
      try {
        await updateProfileImageMutation.mutateAsync({ profileImage: base64 });
        setProfileImage(base64);
        setSuccess('Profile image updated!');
      } catch (err) {
        setErrors({ image: err.message || 'Image upload failed' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove profile image
  const handleRemoveImage = async () => {
    setErrors({});
    setSuccess('');
    try {
      await updateProfileImageMutation.mutateAsync({ profileImage: null });
      setProfileImage(null);
      setImagePreview(null);
      setSuccess('Profile image removed');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setErrors({ image: err.message || 'Failed to remove image' });
    }
  };

  return (
    <div>
      {/* Profile Picture Section */}
      <div className="card mb-4" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="card-header" style={{ background: 'transparent', borderBottom: 'none' }}>
          <h5 className="card-title mb-0" style={{ fontWeight: 600, fontSize: 20 }}>
            Edit Profile
          </h5>
        </div>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              className="profile-avatar-large"
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD600 0%, #FFB300 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                <span style={{ fontSize: 36, fontWeight: 600, color: '#222' }}>{generateInitials(user)}</span>
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="profile-upload" style={{ display: 'block' }}>
              <button
                type="button"
                className="btn btn-outline-secondary"
                style={{ fontWeight: 500, borderRadius: 8, padding: '8px 20px', fontSize: 16 }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                Upload new photo
              </button>
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <div style={{ color: '#888', fontSize: 14, marginTop: 10 }}>
              Max 2MB. JPG, PNG, GIF, BMP, or WEBP allowed.
            </div>
            {imagePreview && (
              <button
                type="button"
                className="btn btn-link text-danger"
                style={{ padding: 0, marginTop: 8, fontSize: 14 }}
                onClick={handleRemoveImage}
              >
                Remove Image
              </button>
            )}
            {errors.image && <div className="text-danger mt-2">{errors.image}</div>}
          </div>
        </div>
      </div>
      {/* Display Name & Job Title Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <User size={20} className="me-2" />
            Update Display Name & Job Title
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleProfileSubmit}>
            <div className="mb-3">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-control"
                value={displayName}
                maxLength={MAX_LENGTH}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter display name"
              />
              <div className="form-text">Max 50 characters</div>
              {errors.displayName && <div className="text-danger">{errors.displayName}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">Job Title</label>
              <input
                type="text"
                className="form-control"
                value={jobTitle}
                maxLength={MAX_LENGTH}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Enter job title"
              />
              <div className="form-text">Max 50 characters</div>
              {errors.jobTitle && <div className="text-danger">{errors.jobTitle}</div>}
            </div>
            <button type="submit" className="btn btn-primary">Save Changes</button>
            {errors.form && <div className="text-danger mt-2">{errors.form}</div>}
            {success && <div className="text-success mt-2">{success}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
