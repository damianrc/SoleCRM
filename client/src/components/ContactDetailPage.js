import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getAuthToken, getUserId, isAuthenticated } from '../utils/auth.js';
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
        if (!isAuthenticated()) {
          navigate('/login');
          return;
        }

        const token = getAuthToken();
        const response = await fetch(`http://localhost:4000/api/contacts/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const contactData = await response.json();
          setContact(contactData);
        } else if (response.status === 401) {
          navigate('/login');
        } else {
          console.error('Failed to fetch contact details');
          const userId = getUserId();
          navigate(`/dashboard/${userId}/contacts`);
        }
      } catch (error) {
        console.error('Error loading contact:', error);
        const userId = getUserId();
        navigate(`/dashboard/${userId}/contacts`);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id, location.state, navigate]);

  const handleBack = () => {
    const userId = getUserId();
    navigate(`/dashboard/${userId}/contacts`);
  };

  const handleContactUpdate = async (contactId, field, value) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      // Send the full contact object with the updated field
      const updateData = { ...contact, [field]: value };
      const response = await fetch(`http://localhost:4000/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Re-fetch the full contact to get all related data
        const refreshed = await fetch(`http://localhost:4000/api/contacts/${contactId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (refreshed.ok) {
          const fullContact = await refreshed.json();
          setContact(fullContact);
        } else {
          // fallback: use the partial update
          const updatedContact = await response.json();
          setContact(updatedContact);
        }
        console.log('Contact updated successfully');
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to update contact:', errorData.error);
        alert('Failed to update contact: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      alert('Error updating contact. Please try again.');
    }
  };

  const handleNavigateToTasks = () => {
    navigate('/protected/tasks');
  };

  // Task management functions
  const handleAddTask = async (taskData) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const newTask = await response.json();
        setContact(prevContact => ({
          ...prevContact,
          tasks: [newTask, ...(prevContact.tasks || [])]
        }));
        console.log('Task added successfully');
        return newTask;
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to add task:', errorData.error);
        alert('Failed to add task: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Error adding task. Please try again.');
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setContact(prevContact => ({
          ...prevContact,
          tasks: prevContact.tasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        }));
        console.log('Task updated successfully');
        return updatedTask;
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to update task:', errorData.error);
        alert('Failed to update task: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setContact(prevContact => ({
          ...prevContact,
          tasks: prevContact.tasks.filter(task => task.id !== taskId)
        }));
        console.log('Task deleted successfully');
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete task:', errorData.error);
        alert('Failed to delete task: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task. Please try again.');
    }
  };

  // Note management functions
  const handleAddNote = async (noteData) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        const newNote = await response.json();
        setContact(prevContact => ({
          ...prevContact,
          notes: [newNote, ...(prevContact.notes || [])]
        }));
        console.log('Note added successfully');
        return newNote;
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to add note:', errorData.error);
        alert('Failed to add note: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note. Please try again.');
    }
  };

  const handleUpdateNote = async (noteId, noteData) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setContact(prevContact => ({
          ...prevContact,
          notes: prevContact.notes.map(note => 
            note.id === noteId ? updatedNote : note
          )
        }));
        console.log('Note updated successfully');
        return updatedNote;
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to update note:', errorData.error);
        alert('Failed to update note: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Error updating note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setContact(prevContact => ({
          ...prevContact,
          notes: prevContact.notes.filter(note => note.id !== noteId)
        }));
        console.log('Note deleted successfully');
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete note:', errorData.error);
        alert('Failed to delete note: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note. Please try again.');
    }
  };

  // Activity management functions
  const handleAddActivity = async (activityData) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(activityData)
      });

      if (response.ok) {
        const newActivity = await response.json();
        setContact(prevContact => ({
          ...prevContact,
          activities: [newActivity, ...(prevContact.activities || [])]
        }));
        console.log('Activity added successfully');
        return newActivity;
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to add activity:', errorData.error);
        alert('Failed to add activity: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Error adding activity. Please try again.');
    }
  };

  const handleUpdateActivity = async (activityId, activityData) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(activityData)
      });

      if (response.ok) {
        const updatedActivity = await response.json();
        setContact(prevContact => ({
          ...prevContact,
          activities: prevContact.activities.map(activity => 
            activity.id === activityId ? updatedActivity : activity
          )
        }));
        console.log('Activity updated successfully');
        return updatedActivity;
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to update activity:', errorData.error);
        alert('Failed to update activity: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      alert('Error updating activity. Please try again.');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setContact(prevContact => ({
          ...prevContact,
          activities: prevContact.activities.filter(activity => activity.id !== activityId)
        }));
        console.log('Activity deleted successfully');
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete activity:', errorData.error);
        alert('Failed to delete activity: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Error deleting activity. Please try again.');
    }
  };

  const handleToggleTaskCompletion = async (taskId) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const task = contact.tasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

      const token = getAuthToken();
      const response = await fetch(`http://localhost:4000/api/contacts/${id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...task,
          status: newStatus
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setContact(prevContact => ({
          ...prevContact,
          tasks: prevContact.tasks.map(t => 
            t.id === taskId ? updatedTask : t
          )
        }));
        console.log('Task status updated successfully');
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Failed to update task status:', errorData.error);
        alert('Failed to update task status: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status. Please try again.');
    }
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
      onAddTask={handleAddTask}
      onUpdateTask={handleUpdateTask}
      onDeleteTask={handleDeleteTask}
      onToggleTaskCompletion={handleToggleTaskCompletion}
      onAddNote={handleAddNote}
      onUpdateNote={handleUpdateNote}
      onDeleteNote={handleDeleteNote}
      onAddActivity={handleAddActivity}
      onUpdateActivity={handleUpdateActivity}
      onDeleteActivity={handleDeleteActivity}
    />
  );
};

export default ContactDetailPage;