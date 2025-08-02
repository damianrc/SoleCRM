import React, { useState, useMemo } from 'react';
import ContactsList from './ContactsList';
import AddContactModal from './AddContactModal';
import CSVImportModal from './CSVImportModal';
import { 
  useContacts, 
  useDeleteContacts, 
  useUpdateContact, 
  useAddContact,
  useBulkImportContacts 
} from '../hooks/useContacts';

const ContactsPage = () => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);

  // Filter and view states
  const [selectedView, setSelectedView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    return currentView?.filters || {};
  }, [selectedView, views]);

  // Fetch contacts from the database
  const { data: contactsData, isLoading, error } = useContacts(queryFilters);
  
  // Filter contacts based on search term
  const contacts = useMemo(() => {
    const allContacts = contactsData?.contacts || [];
    if (!searchTerm) return allContacts;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return allContacts.filter(contact =>
      contact.name?.toLowerCase().includes(lowercaseSearch) ||
      contact.email?.toLowerCase().includes(lowercaseSearch) ||
      contact.phone?.toLowerCase().includes(lowercaseSearch) ||
      contact.address?.toLowerCase().includes(lowercaseSearch) ||
      contact.suburb?.toLowerCase().includes(lowercaseSearch)
    );
  }, [contactsData?.contacts, searchTerm]);

  // Mutations for updating and deleting contacts
  const updateContactMutation = useUpdateContact();
  const deleteContactsMutation = useDeleteContacts();
  const addContactMutation = useAddContact();
  const bulkImportMutation = useBulkImportContacts();

  const handleContactUpdate = async (contactId, updatedData) => {
    try {
      await updateContactMutation.mutateAsync({
        id: contactId,
        data: updatedData
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
    console.log('View contact:', contactId);
    // Here you would typically navigate to a contact detail page
  };

  const handleAddContact = () => {
    setIsAddModalOpen(true);
  };

  const handleCSVImport = () => {
    setIsCSVImportModalOpen(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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
    <div style={{ padding: '2rem', maxWidth: '100%' }}>
      {/* Header with title and action buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            � Contacts
          </h1>
          <span style={{ 
            fontSize: '0.875rem', 
            color: '#64748b',
            backgroundColor: '#f1f5f9',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem'
          }}>
            {contacts.length} contacts
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleCSVImport}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              color: '#374151',
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
              backgroundColor: '#3b82f6',
              color: 'white',
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

      {/* Controls section with view selector and search */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        {/* View Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
            View:
          </label>
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'white'
            }}
          >
            {views.map(view => (
              <option key={view.id} value={view.id}>{view.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
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
                color: '#6b7280'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          color: '#64748b'
        }}>
          Loading contacts from database...
        </div>
      ) : contacts.length > 0 ? (
        <ContactsList
          contacts={contacts}
          onContactUpdate={handleContactUpdate}
          onContactSelect={handleContactSelect}
          onBulkDelete={handleBulkDelete}
          onViewContact={handleViewContact}
        />
      ) : (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          <div>
            <h3>No contacts found</h3>
            <p>Try adjusting your filters or add some contacts to get started.</p>
          </div>
        </div>
      )}

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
