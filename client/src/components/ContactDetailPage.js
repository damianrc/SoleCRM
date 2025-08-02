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
    const fetchContact = async () => {
      setLoading(true);
      
      // First try to get contact from navigation state
      if (location.state && location.state.contact) {
        setContact(location.state.contact);
        setLoading(false);
        return;
      }

      // If not in state, fetch from API
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:4000/api/contacts/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const contactData = await response.json();
          setContact(contactData);
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          console.error('Failed to fetch contact details');
          navigate('/dashboard/' + localStorage.getItem('userId') + '/contacts');
        }
      } catch (error) {
        console.error('Error loading contact:', error);
        navigate('/dashboard/' + localStorage.getItem('userId') + '/contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id, location.state, navigate]);

  const handleBack = () => {
    const userId = localStorage.getItem('userId');
    navigate(`/dashboard/${userId}/contacts`);
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