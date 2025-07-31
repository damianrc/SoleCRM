import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ContactDetailView from './ContactDetailView';

const ContactDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, try to get contact from navigation state
        if (location.state?.contact) {
          setContact(location.state.contact);
          setLoading(false);
          return;
        }

        // If no state, try to fetch from API (when user navigates directly to URL)
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // TODO: Replace with actual API call
        // For now, we'll create a mock contact or redirect back
        const response = await fetch(`http://localhost:4000/leads/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const contactData = await response.json();
          setContact(contactData);
        } else if (response.status === 404) {
          setError('Contact not found');
        } else {
          setError('Failed to load contact');
        }
      } catch (error) {
        console.error('Error fetching contact:', error);
        
        // For demo purposes, create a mock contact if API fails
        const mockContact = {
          id: parseInt(id),
          name: 'Sample Contact',
          email: 'sample@example.com',
          phone: '+1234567890',
          address: '123 Main St, City, State',
          status: 'NEW',
          customFields: [],
          tasks: [],
          notes: [],
          activities: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setContact(mockContact);
        setError(null); // Clear error since we're using mock data
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContact();
    } else {
      setError('No contact ID provided');
      setLoading(false);
    }
  }, [id, navigate, location.state]);

  const handleBack = () => {
    navigate('/protected/contacts');
  };

  const handleContactUpdate = async (contactId, field, value) => {
    try {
      // Update local state immediately for better UX
      setContact(prevContact => {
        if (!prevContact) return prevContact;
        
        if (field === 'tasks' || field === 'notes' || field === 'activities') {
          return { ...prevContact, [field]: value };
        } else {
          return { ...prevContact, [field]: value };
        }
      });

      // TODO: Send update to backend
      // const token = localStorage.getItem('token');
      // await fetch(`http://localhost:4000/leads/${contactId}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ [field]: value })
      // });

      console.log(`Updated contact ${contactId}, field ${field}:`, value);
    } catch (error) {
      console.error('Failed to update contact:', error);
      // TODO: Show error message to user
      // TODO: Revert local state change on error
    }
  };

  const handleNavigateToTasks = () => {
    navigate('/protected/tasks');
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading contact...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        gap: '16px'
      }}>
        <div style={{ fontSize: '18px', color: '#e74c3c' }}>
          Error: {error}
        </div>
        <button 
          onClick={handleBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Contacts
        </button>
      </div>
    );
  }

  // No contact found
  if (!contact) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        gap: '16px'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>
          Contact not found
        </div>
        <button 
          onClick={handleBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Contacts
        </button>
      </div>
    );
  }

  // Render the contact detail view
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