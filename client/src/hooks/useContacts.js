import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders, getUserId } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Query Keys - centralized for better cache management
export const contactsQueryKeys = {
  all: ['contacts'],
  lists: () => [...contactsQueryKeys.all, 'list'],
  list: (filters) => [...contactsQueryKeys.lists(), { filters }],
  details: () => [...contactsQueryKeys.all, 'detail'],
  detail: (id) => [...contactsQueryKeys.details(), id],
};

// Custom hook for fetching all contacts
export const useContacts = (filters = {}) => {
  return useQuery({
    queryKey: contactsQueryKeys.list(filters),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => {
      // Apply client-side filtering if needed
      let contacts = data.contacts || [];
      
      // Apply filters
      if (Object.keys(filters).length > 0) {
        contacts = contacts.filter(contact => {
          return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            return contact[key] === value;
          });
        });
      }
      
      return { ...data, contacts };
    },
  });
};

// Custom hook for fetching a single contact
export const useContact = (contactId) => {
  return useQuery({
    queryKey: contactsQueryKeys.detail(contactId),
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
    enabled: !!contactId,
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
      // Invalidate and refetch contacts list
      queryClient.invalidateQueries({ queryKey: contactsQueryKeys.lists() });
      
      // Optionally add the new contact to the cache
      queryClient.setQueryData(contactsQueryKeys.detail(newContact.id), newContact);
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
      const updateData = { ...updates, userId };
      
      const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update contact: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (updatedContact, { contactId }) => {
      // Update the specific contact in the cache
      queryClient.setQueryData(contactsQueryKeys.detail(contactId), updatedContact);
      
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
        queryClient.removeQueries({ queryKey: contactsQueryKeys.detail(id) });
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
