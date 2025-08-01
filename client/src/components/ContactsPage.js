import React, { useState, useEffect } from 'react';
import ContactsList from './ContactsList';
import AddContactModal from './AddContactModal';
import { useNavigate } from 'react-router-dom';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  // Load contacts from localStorage on component mount
  useEffect(() => {
    const loadContacts = () => {
      try {
        const savedContacts = localStorage.getItem('crm_contacts');
        if (savedContacts) {
          const parsedContacts = JSON.parse(savedContacts);
          setContacts(parsedContacts);
          console.log('Loaded contacts from localStorage:', parsedContacts);
        } else {
          console.log('No contacts found in localStorage');
        }
      } catch (error) {
        console.error('Error loading contacts from localStorage:', error);
      }
    };

    loadContacts();
  }, []);

  // Save contacts to localStorage whenever contacts change
  useEffect(() => {
    if (contacts.length > 0) {
      try {
        localStorage.setItem('crm_contacts', JSON.stringify(contacts));
        console.log('Saved contacts to localStorage:', contacts);
      } catch (error) {
        console.error('Error saving contacts to localStorage:', error);
      }
    }
  }, [contacts]);

  const handleContactUpdate = async (contactId, field, value) => {
    console.log(`Updating contact ${contactId}, field ${field} with value ${value}`);
    
    // Update local state
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === contactId ? { 
          ...contact, 
          [field]: value,
          updatedAt: new Date().toISOString()
        } : contact
      )
    );

    // TODO: Send update to backend when ready
    // const token = localStorage.getItem('token');
    // try {
    //   await fetch(`http://localhost:4000/leads/${contactId}`, {
    //     method: 'PATCH',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ [field]: value })
    //   });
    // } catch (error) {
    //   console.error('Failed to update contact:', error);
    // }
  };

  const handleAddContact = () => {
    setIsAddModalOpen(true);
  };

  const handleAddContactSubmit = async (newContact) => {
    try {
      // Add to local state with generated ID
      const contactWithId = {
        ...newContact,
        id: Date.now(), // Temporary ID generation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Initialize arrays if they don't exist
        customFields: newContact.customFields || [],
        tasks: newContact.tasks || [],
        notes: newContact.notes || [],
        activities: newContact.activities || []
      };

      setContacts(prevContacts => {
        const updatedContacts = [...prevContacts, contactWithId];
        console.log('Adding new contact:', contactWithId);
        return updatedContacts;
      });

      // TODO: Send to backend when ready
      // const token = localStorage.getItem('token');
      // const response = await fetch('http://localhost:4000/leads', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(newContact)
      // });
      // 
      // if (response.ok) {
      //   const createdContact = await response.json();
      //   setContacts(prevContacts => [...prevContacts, createdContact]);
      // }

      console.log('Contact added successfully:', contactWithId);
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleBulkDelete = async (contactIds) => {
    console.log('Bulk delete contacts:', contactIds);
    
    // Update local state
    setContacts(prevContacts => {
      const updatedContacts = prevContacts.filter(contact => !contactIds.includes(contact.id));
      console.log('Contacts after bulk delete:', updatedContacts);
      return updatedContacts;
    });

    // TODO: Send to backend when ready
    // const token = localStorage.getItem('token');
    // try {
    //   await fetch('http://localhost:4000/leads/bulk-delete', {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ ids: contactIds })
    //   });
    // } catch (error) {
    //   console.error('Failed to delete contacts:', error);
    // }
  };

  const handleContactSelect = (contact) => {
    navigate(`/protected/contacts/${contact.id}`, { state: { contact } });
  };

  return (
    <>
      <h2>Contacts</h2>
      <ContactsList
        contacts={contacts}
        onContactUpdate={handleContactUpdate}
        onContactSelect={handleContactSelect}
        onAddContact={handleAddContact}
        onBulkDelete={handleBulkDelete}
      />
      
      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onAddContact={handleAddContactSubmit}
      />
    </>
  );
};

export default ContactsPage;