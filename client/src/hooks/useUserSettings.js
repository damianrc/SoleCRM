import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// API functions
const fetchUserProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user profile');
  }

  return response.json();
};

const updateUserEmail = async ({ email, currentPassword }) => {
  const response = await fetch(`${API_BASE_URL}/api/users/email`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, currentPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update email');
  }

  return response.json();
};

const updateUserPassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  const response = await fetch(`${API_BASE_URL}/api/users/password`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update password');
  }

  return response.json();
};

const updateUserDisplayName = async ({ displayName, jobTitle }) => {
  const response = await fetch(`${API_BASE_URL}/api/users/display-name`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ displayName, jobTitle }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update display name');
  }

  return response.json();
};

const updateUserProfileImage = async ({ profileImage }) => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile-image`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profileImage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile image');
  }

  return response.json();
};

// Custom hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) return false;
      return failureCount < 3;
    },
  });
};

export const useUpdateEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserEmail,
    onSuccess: (data) => {
      // Update the user profile cache with new email
      queryClient.setQueryData(['userProfile'], (oldData) => ({
        ...oldData,
        user: {
          ...oldData?.user,
          ...data.user,
        },
      }));
    },
    onError: (error) => {
      console.error('Email update error:', error);
    },
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: updateUserPassword,
    onError: (error) => {
      console.error('Password update error:', error);
    },
  });
};

export const useUpdateDisplayName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserDisplayName,
    onSuccess: (data) => {
      // Update the user profile cache with new display name
      queryClient.setQueryData(['userProfile'], (oldData) => ({
        ...oldData,
        user: {
          ...oldData?.user,
          ...data.user,
        },
      }));
    },
    onError: (error) => {
      console.error('Display name update error:', error);
    },
  });
};

export const useUpdateProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfileImage,
    onSuccess: (data) => {
      // Update the user profile cache with new profile image
      queryClient.setQueryData(['userProfile'], (oldData) => ({
        ...oldData,
        user: {
          ...oldData?.user,
          ...data.user,
        },
      }));
    },
    onError: (error) => {
      console.error('Profile image update error:', error);
    },
  });
};
