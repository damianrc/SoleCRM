import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ContactDetailView from './ContactDetailView';

const ContactDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First try to get contact from navigation state
    if (location.state && location.state.contact) {
      setContact(location.state.contact);
      setLoading(false);
      return;
    }

    // If not in state, try to load from localStorage
    try {
      const savedContacts = localStorage.getItem('crm_contacts');
      if (savedContacts) {
        const contacts = JSON.parse(savedContacts);
        const foundContact = contacts.find(c => c.id === parseInt(id));
        if (foundContact) {
          setContact(foundContact);
        } else {
          console.error('Contact not found');
          navigate('/protected/contacts');
        }
      } else {
        console.error('No contacts found in localStorage');
        navigate('/protected/contacts');
      }
    } catch (error) {
      console.error('Error loading contact:', error);
      navigate('/protected/contacts');
    }
    
    setLoading(false);
  }, [id, location.state, navigate]);

  const handleBack = () => {
    navigate('/protected/contacts');
  };

  const handleContactUpdate = (contactId, field, value) => {
    // Update the current contact state
    setContact(prevContact => ({
      ...prevContact,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));

    // Update in localStorage
    try {
      const savedContacts = localStorage.getItem('crm_contacts');
      if (savedContacts) {
        const contacts = JSON.parse(savedContacts);
        const updatedContacts = contacts.map(c => 
          c.id === contactId 
            ? { ...c, [field]: value, updatedAt: new Date().toISOString() }
            : c
        );
        localStorage.setItem('crm_contacts', JSON.stringify(updatedContacts));
        console.log('Contact updated in localStorage');
      }
    } catch (error) {
      console.error('Error updating contact in localStorage:', error);
    }
  };

  const handleNavigateToTasks = () => {
    navigate('/protected/tasks');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!contact) {
    return <div>Contact not found</div>;
  }

  return (
    <ContactDetailView
      contact={contact}
      onBack={handleBack}
      onContactUpdate={handleContactUpdate}
      onNavigateToTasks={handleNavigateToTasks}
    />
  );
};

export default ContactDetailPage;