import React, { useState, useEffect } from 'react';
import TasksView from './TasksView';
import { useNavigate } from 'react-router-dom';

const TasksPage = () => {
  const [contacts, setContacts] = useState([]); // TasksView expects contacts to derive tasks
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
          setContacts(data.contacts);
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to fetch contacts for tasks:', error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchContacts();
  }, [navigate]);

  const handleTaskUpdate = (contactId, taskId, updatedTask) => {
    console.log(`Updating task ${taskId} for contact ${contactId}`);
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === contactId
          ? {
            ...contact,
            tasks: contact.tasks.map(task =>
              task.id === taskId ? updatedTask : task
            )
          }
          : contact
      )
    );
  };

  return (
    <div>
      <h2>Tasks</h2>
      <TasksView
        contacts={contacts}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
};

export default TasksPage;
