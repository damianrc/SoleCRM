import { useUserContactProperties } from '../hooks/useUserContactProperties';

// This hook provides the current user's options for Type, Source, and Status
export function useContactPropertyOptions() {
  const { data, isLoading, error } = useUserContactProperties();
  // Fallback to sensible defaults if not loaded
  return {
    typeOptions: data?.typeOptions || ['Buyer', 'Seller', 'Past Client', 'Lead'],
    sourceOptions: data?.sourceOptions || ['Website', 'Referral', 'Social Media', 'Event'],
    statusOptions: data?.statusOptions || ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    isLoading,
    error
  };
}
