import React, { useState, useEffect } from 'react';
import ContactsList from './ContactsList';
import AddContactModal from './AddContactModal';
import { useNavigate } from 'react-router-dom';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContacts = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await fetch('http://localhost:4000/leads', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts || []);
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchContacts();
  }, [navigate]);

  const handleContactUpdate = async (contactId, field, value) => {
    console.log(`Updating contact ${contactId}, field ${field} with value ${value}`);
    
    // Update local state
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    );

    // TODO: Send update to backend
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
        updatedAt: new Date().toISOString()
      };

      setContacts(prevContacts => [...prevContacts, contactWithId]);

      // TODO: Send to backend
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

      console.log('Contact added:', contactWithId);
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
    setContacts(prevContacts => prevContacts.filter(contact => !contactIds.includes(contact.id)));

    // TODO: Send to backend
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