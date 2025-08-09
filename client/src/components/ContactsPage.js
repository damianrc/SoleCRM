import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactsList from './ContactsList';
import AddContactModal from './AddContactModal';
import CSVImportModal from './CSVImportModal.js';
import { 
  useContacts, 
  useDeleteContacts, 
  useUpdateContact, 
  useAddContact,
  useBulkImportContacts 
} from '../hooks/useContacts.js';
import { getUserId } from '../utils/auth.js';

const ContactsPage = () => {
  const navigate = useNavigate();
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);

  // Filter and view states
  const [selectedView, setSelectedView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(100);

  // Views configuration
  const views = useMemo(() => [
    { id: 'all', name: 'All Contacts', filters: {} },
    { id: 'buyers', name: 'Buyer Leads', filters: { contactType: 'BUYER' } },
    { id: 'sellers', name: 'Seller Leads', filters: { contactType: 'SELLER' } },
    { id: 'active', name: 'Active Contacts', filters: { status: 'Active' } },
  ], []);

  // Compute filters for the query
  const queryFilters = useMemo(() => {
    const currentView = views.find(v => v.id === selectedView);
    let filters = { ...currentView?.filters || {} };
    
    // Add search term to filters (server-side search)
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    
    return filters;
  }, [selectedView, views, searchTerm]);

  // Fetch contacts from the database with pagination
  console.log('Current pageLimit:', pageLimit);
  const { data: contactsData, isLoading, error, refetch, isFetching } = useContacts(queryFilters, currentPage, pageLimit);
  
  // Extract contacts and pagination info
  const contacts = contactsData?.contacts || [];
  const pagination = contactsData?.pagination || {};

  // Reset to page 1 when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle page limit changes
  const handlePageLimitChange = (newLimit) => {
    setPageLimit(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  };

  // Reset pagination when view or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedView, searchTerm]);

  // Mutations for updating and deleting contacts
  const updateContactMutation = useUpdateContact();
  const deleteContactsMutation = useDeleteContacts();
  const addContactMutation = useAddContact();
  const bulkImportMutation = useBulkImportContacts();

  const handleContactUpdate = async (contactId, updatedData) => {
    try {
      await updateContactMutation.mutateAsync({
        contactId: contactId,
        updates: updatedData
      });
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleContactSelect = (contactId) => {
    console.log('Contact selected:', contactId);
  };

  const handleBulkDelete = async (selectedIds) => {
    try {
      await deleteContactsMutation.mutateAsync(selectedIds);
      console.log('Bulk deleted contacts:', selectedIds);
    } catch (error) {
      console.error('Failed to delete contacts:', error);
    }
  };

  const handleViewContact = (contactId) => {
    const userId = getUserId();
    if (userId && contactId) {
      navigate(`/dashboard/${userId}/contacts/${contactId}`);
    } else {
      console.error('Missing userId or contactId for navigation');
    }
  };

  const handleAddContact = () => {
    setIsAddModalOpen(true);
  };

  const handleCSVImport = () => {
    setIsCSVImportModalOpen(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Pagination reset is handled by useEffect above
  };

  const handleSelectionChange = (selectedIds) => {
    setSelectedContactIds(selectedIds);
  };

  const handleBulkDeleteClick = async () => {
    if (selectedContactIds.length > 0) {
      try {
        await deleteContactsMutation.mutateAsync(selectedContactIds);
        setSelectedContactIds([]); // Clear selection after successful delete
        console.log('Bulk deleted contacts:', selectedContactIds);
      } catch (error) {
        console.error('Failed to delete contacts:', error);
      }
    }
  };

  if (error) {
    return (
      <div style={{ 
        padding: '2rem',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        color: '#dc2626',
        textAlign: 'center'
      }}>
        <div>
          <h2>Error Loading Contacts</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Fixed Header */}
      <div style={{ 
        paddingTop: '15px',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        paddingBottom: '0',
        backgroundColor: 'var(--color-primary-bg)',
        flexShrink: 0
      }}>
        {/* Header with title */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          marginBottom: '0.5rem'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'var(--color-primary-text)' }}>
            Contacts
          </h1>
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--color-secondary-text)',
            backgroundColor: 'var(--color-table-row-hover)',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem'
          }}>
            {pagination.total || 0} total contacts
          </span>
        </div>
      </div>

      {/* Controls section directly above table */}
      <div style={{ 
        padding: '20px 2rem 20px 2rem', // 20px top and bottom padding
        backgroundColor: 'var(--color-primary-bg)',
        flexShrink: 0
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '1rem'
        }}>
          {/* Left side - Search and View Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-primary-text)',
                  backgroundColor: 'var(--color-primary-bg)'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: 'var(--color-disabled-text)'
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-primary-text)' }}>
                View:
              </label>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--color-primary-bg)',
                  color: 'var(--color-primary-text)'
                }}
              >
                {views.map(view => (
                  <option key={view.id} value={view.id}>{view.name}</option>
                ))}
              </select>
            </div>

            {/* Delete button - only show when contacts are selected */}
            {selectedContactIds.length > 0 && (
              <button
                onClick={handleBulkDeleteClick}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-error)',
                  color: 'var(--color-button-primary-text)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
                disabled={deleteContactsMutation.isPending}
              >
                {deleteContactsMutation.isPending ? 'Deleting...' : `Delete (${selectedContactIds.length})`}
              </button>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={handleCSVImport}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--color-primary-border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--color-button-secondary-bg)',
                color: 'var(--color-button-secondary-text)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              disabled={isLoading || bulkImportMutation.isPending}
            >
              {bulkImportMutation.isPending ? 'Importing...' : 'Import'}
            </button>
            <button 
              onClick={handleAddContact}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--color-button-primary-bg)',
                color: 'var(--color-button-primary-text)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              disabled={isLoading || addContactMutation.isPending}
            >
              {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Table (takes remaining space minus pagination, only table scrolls) */}
      <div style={{ 
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // Important for flex child to be scrollable
        marginBottom: contacts.length > 0 ? '80px' : '0' // Reserve space for pagination when it exists
      }}>
        {isLoading || isFetching ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'var(--color-secondary-text)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div>Loading contacts from database...</div>
              {isFetching && !isLoading && (
                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--color-disabled-text)' }}>
                  Updating...
                </div>
              )}
            </div>
          </div>
        ) : contacts.length > 0 ? (
          <div style={{ 
            flex: 1,
            overflow: 'hidden',
            padding: '0 2rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <ContactsList
              contacts={contacts}
              onContactUpdate={handleContactUpdate}
              onContactSelect={handleContactSelect}
              onBulkDelete={handleBulkDelete}
              onViewContact={handleViewContact}
              onSelectionChange={handleSelectionChange}
              onBulkDeleteClick={handleBulkDeleteClick}
            />
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'var(--color-secondary-text)',
            textAlign: 'center'
          }}>
            <div>
              <h3>No contacts found</h3>
              <p>Try adjusting your filters or add some contacts to get started.</p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Pagination Controls at Bottom - Always show when there are contacts */}
      {contacts.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px', // Fixed height to match the marginBottom above
          padding: '1rem 2rem',
          borderTop: '1px solid var(--color-secondary-border)',
          backgroundColor: 'var(--color-table-header-bg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 10
        }}>
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-primary-border)',
              borderRadius: '0.375rem',
              backgroundColor: currentPage <= 1 ? 'var(--color-disabled-bg)' : 'var(--color-primary-bg)',
              color: currentPage <= 1 ? 'var(--color-disabled-text)' : 'var(--color-primary-text)',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            ← Prev
          </button>

          {/* Page Numbers */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(() => {
              const totalPages = Math.max(pagination.totalPages || 1, 1);
              const pageNumbers = [];
              
              // Always show first page
              pageNumbers.push(1);
              
              if (totalPages > 1) {
                // Show ellipsis if there's a gap
                if (currentPage > 3) {
                  pageNumbers.push('...');
                }
                
                // Show pages around current page
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                
                for (let i = start; i <= end; i++) {
                  if (!pageNumbers.includes(i)) {
                    pageNumbers.push(i);
                  }
                }
                
                // Show ellipsis if there's a gap
                if (currentPage < totalPages - 2) {
                  if (!pageNumbers.includes(totalPages - 1)) {
                    pageNumbers.push('...');
                  }
                }
                
                // Always show last page
                if (!pageNumbers.includes(totalPages)) {
                  pageNumbers.push(totalPages);
                }
              }
              
              return pageNumbers.map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span 
                      key={`ellipsis-${index}`}
                      style={{
                        padding: '0.5rem 0.75rem',
                        color: 'var(--color-disabled-text)',
                        fontSize: '0.875rem'
                      }}
                    >
                      ...
                    </span>
                  );
                }
                
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--color-primary-border)',
                      borderRadius: '0.375rem',
                      backgroundColor: isActive ? 'var(--color-button-primary-bg)' : 'var(--color-primary-bg)',
                      color: isActive ? 'var(--color-button-primary-text)' : 'var(--color-primary-text)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? '600' : '500',
                      minWidth: '2.5rem'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= Math.max(pagination.totalPages || 1, 1)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-primary-border)',
              borderRadius: '0.375rem',
              backgroundColor: currentPage >= Math.max(pagination.totalPages || 1, 1) ? 'var(--color-disabled-bg)' : 'var(--color-primary-bg)',
              color: currentPage >= Math.max(pagination.totalPages || 1, 1) ? 'var(--color-disabled-text)' : 'var(--color-primary-text)',
              cursor: currentPage >= Math.max(pagination.totalPages || 1, 1) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            Next →
          </button>

          {/* Page Size Selector */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginLeft: '2rem',
            paddingLeft: '2rem',
            borderLeft: '1px solid var(--color-secondary-border)'
          }}>
            <select
              value={pageLimit}
              onChange={(e) => handlePageLimitChange(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--color-primary-border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--color-primary-bg)',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--color-primary-text)'
              }}
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={75}>75 per page</option>
              <option value={100}>100 per page</option>
              <option value={150}>150 per page</option>
            </select>
          </div>
        </div>
      )}
    </div>

    {/* Modals */}
    {isAddModalOpen && (
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddContact={async (contactData) => {
          try {
            await addContactMutation.mutateAsync(contactData);
            setIsAddModalOpen(false);
          } catch (error) {
            console.error('Failed to add contact:', error);
          }
        }}
      />
    )}

    {isCSVImportModalOpen && (
      <CSVImportModal
        isOpen={isCSVImportModalOpen}
        onClose={() => setIsCSVImportModalOpen(false)}
        onImport={async (importData) => {
          try {
            await bulkImportMutation.mutateAsync(importData);
            setIsCSVImportModalOpen(false);
          } catch (error) {
            console.error('Failed to import contacts:', error);
          }
        }}
      />
    )}
    </div>
  );
};

export default ContactsPage;
