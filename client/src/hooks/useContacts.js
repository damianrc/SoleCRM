import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders, getUserId } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Query Keys - centralized for better cache management
export const contactsQueryKeys = {
  all: ['contacts'],
  lists: () => [...contactsQueryKeys.all, 'list'],
  list: (userId, filters) => [...contactsQueryKeys.lists(), userId, { filters }],
  details: () => [...contactsQueryKeys.all, 'detail'],
  detail: (userId, id) => [...contactsQueryKeys.details(), userId, id],
};

// Custom hook for fetching all contacts with pagination
export const useContacts = (filters = {}, page = 1, limit = 100) => {
  const userId = getUserId();
  
  return useQuery({
    queryKey: contactsQueryKeys.list(userId, { ...filters, page, limit }),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      // Add pagination parameters
      searchParams.append('page', page.toString());
      searchParams.append('limit', limit.toString());
      
      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/api/contacts?${searchParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!userId, // Only run query if userId is available
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent excessive refetching
    select: (data) => {
      // Return the full response including pagination info
      return {
        contacts: data.contacts || [],
        pagination: data.pagination || {}
      };
    },
  });
};

// Custom hook for fetching a single contact
export const useContact = (contactId) => {
  const userId = getUserId();
  
  return useQuery({
    queryKey: contactsQueryKeys.detail(userId, contactId),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contact: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!(contactId && userId),
    staleTime: 5 * 60 * 1000, // 5 minutes for individual contacts
  });
};

// Mutation for adding a new contact
export const useAddContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newContact) => {
      const userId = getUserId();
      const contactData = { ...newContact, userId };
      
      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('A contact with this email already exists.');
        }
        throw new Error(`Failed to add contact: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (newContact) => {
      const userId = getUserId();
      // Invalidate and refetch contacts list for this user
      queryClient.invalidateQueries({ queryKey: contactsQueryKeys.lists() });
      
      // Optionally add the new contact to the cache
      queryClient.setQueryData(contactsQueryKeys.detail(userId, newContact.id), newContact);
    },
    onError: (error) => {
      console.error('Failed to add contact:', error);
    },
  });
};

// Mutation for updating a contact
export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ contactId, updates }) => {
      const userId = getUserId();
      
      console.log('Updating contact:', contactId, 'with data:', updates);
      
      // Ensure we're using the right data format for the backend
      // Convert empty strings to null for the database
      const processedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value;
        return acc;
      }, {});
      
      const updateData = { ...processedUpdates, userId };
      
      console.log('Processed update data:', updateData);
      
      const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update contact: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (updatedContact, { contactId }) => {
      const userId = getUserId();
      // Update the specific contact in the cache
      queryClient.setQueryData(contactsQueryKeys.detail(userId, contactId), updatedContact);
      
      // Update the contact in any lists that contain it
      queryClient.setQueriesData(
        { queryKey: contactsQueryKeys.lists() },
        (oldData) => {
          if (!oldData?.contacts) return oldData;
          
          return {
            ...oldData,
            contacts: oldData.contacts.map(contact =>
              contact.id === contactId ? updatedContact : contact
            ),
          };
        }
      );
    },
    onError: (error) => {
      console.error('Failed to update contact:', error);
    },
  });
};

// Mutation for deleting contacts (single or bulk)
export const useDeleteContacts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contactIds) => {
      const idsArray = Array.isArray(contactIds) ? contactIds : [contactIds];
      
      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ contactIds: idsArray }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete contacts: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, deletedIds) => {
      const idsArray = Array.isArray(deletedIds) ? deletedIds : [deletedIds];
      
      // Remove deleted contacts from all lists
      queryClient.setQueriesData(
        { queryKey: contactsQueryKeys.lists() },
        (oldData) => {
          if (!oldData?.contacts) return oldData;
          
          return {
            ...oldData,
            contacts: oldData.contacts.filter(contact => !idsArray.includes(contact.id)),
          };
        }
      );
      
      // Remove individual contact queries
      idsArray.forEach(id => {
        const userId = getUserId();
        queryClient.removeQueries({ queryKey: contactsQueryKeys.detail(userId, id) });
      });
    },
    onError: (error) => {
      console.error('Failed to delete contacts:', error);
    },
  });
};

// Mutation for bulk import
export const useBulkImportContacts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (importData) => {
      const response = await fetch(`${API_BASE_URL}/api/contacts/bulk-import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ contacts: importData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Import failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all contact queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });
    },
    onError: (error) => {
      console.error('Failed to import CSV:', error);
    },
  });
};
