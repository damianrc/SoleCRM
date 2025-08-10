import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// API functions
export const fetchUserContactProperties = async () => {
  const response = await fetch(`${API_BASE_URL}/api/user-contact-properties`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch contact property options');
  }
  return response.json();
};

export const updateUserContactProperties = async (options) => {
  const response = await fetch(`${API_BASE_URL}/api/user-contact-properties`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update contact property options');
  }
  return response.json();
};

// React Query hooks
export const useUserContactProperties = () => {
  return useQuery({
    queryKey: ['userContactProperties'],
    queryFn: fetchUserContactProperties,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateUserContactProperties = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserContactProperties,
    onSuccess: () => {
      queryClient.invalidateQueries(['userContactProperties']);
    },
  });
};
