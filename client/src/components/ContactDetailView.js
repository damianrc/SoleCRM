import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin,
  Edit,
  Save,
  X,
  Trash2
} from 'lucide-react';
import './ContactDetailView.css';

/**
 * ContactDetailView Component
 * 
 * This component displays detailed information about a selected contact.
 * It includes multiple tabs: Overview, Tasks, Notes, and Activity.
 * Users can add tasks, notes, and activities, and view contact information.
 * 
 * Props:
 * - contact: The selected contact object
 * - onBack: Function to navigate back to contacts list
 * - onContactUpdate: Function to update contact data
 * - onNavigateToTasks: Function to navigate to all tasks view
 */
const ContactDetailView = ({ 
  contact, 
  onBack, 
  onContactUpdate,
  onNavigateToTasks 
}) => {
  // Tab management state
  const [activeTab, setActiveTab] = useState('overview');

  // Inline editing state - track which field is being edited
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Item editing states for tasks, notes, and activities
  const [editingTask, setEditingTask] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editTaskData, setEditTaskData] = useState({});
  const [editNoteData, setEditNoteData] = useState('');
  const [editActivityData, setEditActivityData] = useState({});

  // Form states for adding new items
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: ''
  });
  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState('call');
  const [activityNote, setActivityNote] = useState('');

  // Status badge color mapping
  const statusColors = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    QUALIFIED: 'bg-green-100 text-green-800',
    PROPOSAL: 'bg-purple-100 text-purple-800',
    NEGOTIATION: 'bg-orange-100 text-orange-800',
    CLOSED_WON: 'bg-emerald-100 text-emerald-800',
    CLOSED_LOST: 'bg-red-100 text-red-800'
  };

  /**
   * Basic email validation
   * @param {string} email - Email to validate
   * @returns {boolean} True if email format is valid
   */
  const isValidEmail = (email) => {
    if (!email) return true; // Empty email is allowed
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Basic phone validation (allows various formats)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if phone format is valid
   */
  const isValidPhone = (phone) => {
    if (!phone) return true; // Empty phone is allowed
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    // Accept phone numbers with 10-15 digits
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  /**
   * Handle starting inline edit for a field
   * @param {string} field - The field to edit
   * @param {string} currentValue - Current value of the field
   */
  const handleStartEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  /**
   * Handle saving inline edit
   * @param {string} field - The field being edited
   */
  const handleSaveEdit = (field) => {
    // Validate the field
    let isValid = true;
    let errorMessage = '';

    if (field === 'name' && !editValue.trim()) {
      isValid = false;
      errorMessage = 'Name is required';
    } else if (field === 'email' && !isValidEmail(editValue)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (field === 'phone' && !isValidPhone(editValue)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    }

    if (!isValid) {
      alert(errorMessage);
      return;
    }

    // Save the change
    const trimmedValue = editValue.trim();
    if (trimmedValue !== contact[field]) {
      onContactUpdate(contact.id, field, trimmedValue);
    }

    // Clear editing state
    setEditingField(null);
    setEditValue('');
  };

  /**
   * Handle canceling inline edit
   */
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  /**
   * Handle key press in edit input
   * @param {Event} e - Keyboard event
   * @param {string} field - The field being edited
   */
  const handleKeyPress = (e, field) => {
    if (e.key === 'Enter') {
      handleSaveEdit(field);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  /**
   * Handle adding a new task to the contact
   * @param {Event} e - Form submit event
   */
  const handleAddTask = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newTask.title) return;

    // Create new task object
    const task = {
      id: Date.now(), // Simple ID generation
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Update contact with new task
    const updatedContact = {
      ...contact,
      tasks: [...(contact.tasks || []), task]
    };

    // Call parent update function
    onContactUpdate(contact.id, 'tasks', updatedContact.tasks);

    // Reset form
    setNewTask({ 
      title: '', 
      description: '', 
      priority: 'MEDIUM', 
      dueDate: '' 
    });
  };

  /**
   * Handle adding a new note to the contact
   * @param {Event} e - Form submit event
   */
  const handleAddNote = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newNote) return;

    // Create new note object
    const note = {
      id: Date.now(),
      text: newNote,
      createdAt: new Date().toISOString(),
    };

    // Update contact with new note
    const updatedContact = {
      ...contact,
      notes: [...(contact.notes || []), note]
    };

    // Call parent update function
    onContactUpdate(contact.id, 'notes', updatedContact.notes);

    // Reset form
    setNewNote('');
  };

  /**
   * Handle adding a new activity to the contact
   * @param {Event} e - Form submit event
   */
  const handleAddActivity = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!activityType || !activityNote) return;

    // Create new activity object
    const activity = {
      id: Date.now(),
      type: activityType,
      note: activityNote,
      createdAt: new Date().toISOString(),
    };

    // Update contact with new activity
    const updatedContact = {
      ...contact,
      activities: [...(contact.activities || []), activity]
    };

    // Call parent update function
    onContactUpdate(contact.id, 'activities', updatedContact.activities);

    // Reset form
    setActivityType('call');
    setActivityNote('');
  };

  /**
   * Handle starting edit for a task
   * @param {Object} task - The task to edit
   */
  const handleStartEditTask = (task) => {
    setEditingTask(task.id);
    setEditTaskData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate || ''
    });
  };

  /**
   * Handle saving task edit
   * @param {number} taskId - ID of the task being edited
   */
  const handleSaveTask = (taskId) => {
    if (!editTaskData.title.trim()) {
      alert('Task title is required');
      return;
    }

    const updatedTasks = contact.tasks.map(task => 
      task.id === taskId 
        ? { ...task, ...editTaskData, title: editTaskData.title.trim() }
        : task
    );

    onContactUpdate(contact.id, 'tasks', updatedTasks);
    setEditingTask(null);
    setEditTaskData({});
  };

  /**
   * Handle canceling task edit
   */
  const handleCancelEditTask = () => {
    setEditingTask(null);
    setEditTaskData({});
  };

  /**
   * Handle deleting a task
   * @param {number} taskId - ID of the task to delete
   */
  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = contact.tasks.filter(task => task.id !== taskId);
      onContactUpdate(contact.id, 'tasks', updatedTasks);
    }
  };

  /**
   * Handle starting edit for a note
   * @param {Object} note - The note to edit
   */
  const handleStartEditNote = (note) => {
    setEditingNote(note.id);
    setEditNoteData(note.text);
  };

  /**
   * Handle saving note edit
   * @param {number} noteId - ID of the note being edited
   */
  const handleSaveNote = (noteId) => {
    if (!editNoteData.trim()) {
      alert('Note content is required');
      return;
    }

    const updatedNotes = contact.notes.map(note => 
      note.id === noteId 
        ? { ...note, text: editNoteData.trim() }
        : note
    );

    onContactUpdate(contact.id, 'notes', updatedNotes);
    setEditingNote(null);
    setEditNoteData('');
  };

  /**
   * Handle canceling note edit
   */
  const handleCancelEditNote = () => {
    setEditingNote(null);
    setEditNoteData('');
  };

  /**
   * Handle deleting a note
   * @param {number} noteId - ID of the note to delete
   */
  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = contact.notes.filter(note => note.id !== noteId);
      onContactUpdate(contact.id, 'notes', updatedNotes);
    }
  };

  /**
   * Handle starting edit for an activity
   * @param {Object} activity - The activity to edit
   */
  const handleStartEditActivity = (activity) => {
    setEditingActivity(activity.id);
    setEditActivityData({
      type: activity.type,
      note: activity.note
    });
  };

  /**
   * Handle saving activity edit
   * @param {number} activityId - ID of the activity being edited
   */
  const handleSaveActivity = (activityId) => {
    if (!editActivityData.note.trim()) {
      alert('Activity note is required');
      return;
    }

    const updatedActivities = contact.activities.map(activity => 
      activity.id === activityId 
        ? { ...activity, ...editActivityData, note: editActivityData.note.trim() }
        : activity
    );

    onContactUpdate(contact.id, 'activities', updatedActivities);
    setEditingActivity(null);
    setEditActivityData({});
  };

  /**
   * Handle canceling activity edit
   */
  const handleCancelEditActivity = () => {
    setEditingActivity(null);
    setEditActivityData({});
  };

  /**
   * Handle deleting an activity
   * @param {number} activityId - ID of the activity to delete
   */
  const handleDeleteActivity = (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      const updatedActivities = contact.activities.filter(activity => activity.id !== activityId);
      onContactUpdate(contact.id, 'activities', updatedActivities);
    }
  };

  /**
   * Format date string for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="contact-detail-view">
      {/* Back Button */}
      <button onClick={onBack} className="back-button">
        <ChevronLeft size={16} /> Back to Contacts
      </button>

      {/* Contact Header */}
      <div className="detail-header">
        <div className="view-header">
          {/* Editable Name */}
          {editingField === 'name' ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSaveEdit('name')}
              onKeyDown={(e) => handleKeyPress(e, 'name')}
              className="edit-name-input"
              placeholder="Contact name"
              autoFocus
            />
          ) : (
            <h1 
              onClick={() => handleStartEdit('name', contact.name)}
              className="editable-name"
              title="Click to edit name"
            >
              {contact.name}
            </h1>
          )}

          {/* Editable Status */}
          {editingField === 'status' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSaveEdit('status')}
              onKeyDown={(e) => handleKeyPress(e, 'status')}
              className="edit-status-select"
              autoFocus
            >
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="CLOSED_WON">Closed Won</option>
              <option value="CLOSED_LOST">Closed Lost</option>
            </select>
          ) : (
            <span 
              className={`status-badge ${statusColors[contact.status]} editable-status`}
              onClick={() => handleStartEdit('status', contact.status)}
              title="Click to edit status"
            >
              {contact.status}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="detail-tabs">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={activeTab === 'overview' ? 'active' : ''}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('tasks')} 
          className={activeTab === 'tasks' ? 'active' : ''}
        >
          Tasks
        </button>
        <button 
          onClick={() => setActiveTab('notes')} 
          className={activeTab === 'notes' ? 'active' : ''}
        >
          Notes
        </button>
        <button 
          onClick={() => setActiveTab('activity')} 
          className={activeTab === 'activity' ? 'active' : ''}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="detail-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Basic Contact Information */}
            <div className="contact-info-grid">
              {/* Email Field */}
              <div className="info-item">
                <Mail size={16} />
                {editingField === 'email' ? (
                  <input
                    type="email"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveEdit('email')}
                    onKeyDown={(e) => handleKeyPress(e, 'email')}
                    placeholder="Email address"
                    className="edit-input"
                    autoFocus
                  />
                ) : (
                  <span 
                    className={`editable-field ${!contact.email ? 'empty' : ''}`}
                    onClick={() => handleStartEdit('email', contact.email)}
                    title="Click to edit email"
                  >
                    {contact.email || 'Click to add email'}
                  </span>
                )}
              </div>

              {/* Phone Field */}
              <div className="info-item">
                <Phone size={16} />
                {editingField === 'phone' ? (
                  <input
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveEdit('phone')}
                    onKeyDown={(e) => handleKeyPress(e, 'phone')}
                    placeholder="Phone number"
                    className="edit-input"
                    autoFocus
                  />
                ) : (
                  <span 
                    className={`editable-field ${!contact.phone ? 'empty' : ''}`}
                    onClick={() => handleStartEdit('phone', contact.phone)}
                    title="Click to edit phone"
                  >
                    {contact.phone || 'Click to add phone'}
                  </span>
                )}
              </div>

              {/* Address Field */}
              <div className="info-item">
                <MapPin size={16} />
                {editingField === 'address' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveEdit('address')}
                    onKeyDown={(e) => handleKeyPress(e, 'address')}
                    placeholder="Address"
                    className="edit-input"
                    autoFocus
                  />
                ) : (
                  <span 
                    className={`editable-field ${!contact.address ? 'empty' : ''}`}
                    onClick={() => handleStartEdit('address', contact.address)}
                    title="Click to edit address"
                  >
                    {contact.address || 'Click to add address'}
                  </span>
                )}
              </div>
            </div>

            {/* Custom Fields Section */}
            <div className="custom-fields">
              <h3>Custom Fields</h3>
              {contact.customFields && contact.customFields.length > 0 ? (
                contact.customFields.map(field => (
                  <div key={field.id} className="custom-field-item">
                    <strong>{field.fieldName}:</strong> {field.value}
                  </div>
                ))
              ) : (
                <p>No custom fields for this contact.</p>
              )}
            </div>

            {/* Latest Activity Section */}
            <div className="latest-activity">
              <h3>Latest Activity</h3>
              <ul>
                {/* Show last 3 activities in reverse chronological order */}
                {(contact.activities || []).slice(-3).reverse().map(activity => (
                  <li key={activity.id}>
                    <strong>{activity.type}</strong>: {activity.note}
                    <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
                      {formatDate(activity.createdAt)}
                    </span>
                  </li>
                ))}
                {(contact.activities || []).length === 0 && (
                  <li>No activities yet.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="tasks-tab">
            <h3>Tasks</h3>
            
            {/* Add New Task Form */}
            <form
              onSubmit={handleAddTask}
              className="task-form"
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}
            >
              <input 
                type="text" 
                placeholder="Task name" 
                value={newTask.title} 
                onChange={e => setNewTask({ ...newTask, title: e.target.value })} 
                required 
              />
              <input 
                type="text" 
                placeholder="Description" 
                value={newTask.description} 
                onChange={e => setNewTask({ ...newTask, description: e.target.value })} 
              />
              <select 
                value={newTask.priority} 
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <input 
                type="date" 
                value={newTask.dueDate} 
                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} 
              />
              <button type="submit">Add Task</button>
            </form>

            {/* Tasks List */}
            <ul className="task-list">
              {(contact.tasks || []).map(task => (
                <li key={task.id} className={`item-container task-item ${task.priority.toLowerCase()} ${editingTask === task.id ? 'editing' : ''}`}>
                  {editingTask === task.id ? (
                    // Edit mode
                    <div className="item-edit">
                      <div className="edit-form-row full-width">
                        <div className="edit-input-group">
                          <label>Task Title</label>
                          <input
                            type="text"
                            value={editTaskData.title}
                            onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                            placeholder="Enter task title"
                            className="edit-input"
                          />
                        </div>
                      </div>
                      <div className="edit-form-row full-width">
                        <div className="edit-input-group">
                          <label>Description</label>
                          <textarea
                            value={editTaskData.description}
                            onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                            placeholder="Enter task description"
                            className="edit-textarea"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="edit-form-row">
                        <div className="edit-input-group">
                          <label>Priority</label>
                          <select
                            value={editTaskData.priority}
                            onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value })}
                            className="edit-select"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>
                        <div className="edit-input-group">
                          <label>Due Date</label>
                          <input
                            type="date"
                            value={editTaskData.dueDate}
                            onChange={(e) => setEditTaskData({ ...editTaskData, dueDate: e.target.value })}
                            className="edit-input"
                          />
                        </div>
                      </div>
                      <div className="edit-actions">
                        <button
                          onClick={() => handleSaveTask(task.id)}
                          className="edit-button save"
                        >
                          <Save size={16} /> Save
                        </button>
                        <button
                          onClick={handleCancelEditTask}
                          className="edit-button cancel"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="item-view">
                      <div className="item-content" onClick={() => handleStartEditTask(task)}>
                        <h4>{task.title}</h4>
                        {task.description && <p>{task.description}</p>}
                        <div className="item-meta">
                          <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                          <span>Due: {task.dueDate || 'No due date'}</span>
                          <span>Created: {formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button
                          onClick={() => handleStartEditTask(task)}
                          className="action-button edit"
                          title="Edit task"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="action-button delete"
                          title="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {(contact.tasks || []).length === 0 && (
                <div className="empty-state">
                  <p>No tasks for this contact yet. Add one above to get started!</p>
                </div>
              )}
            </ul>

            {/* Navigate to All Tasks Button */}
            <button 
              onClick={onNavigateToTasks} 
              style={{ marginTop: 12 }}
            >
              Go to All Tasks
            </button>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="notes-tab">
            <h3>Notes</h3>
            
            {/* Add New Note Form */}
            <form
              onSubmit={handleAddNote}
              style={{ display: 'flex', gap: 8, marginBottom: 16 }}
            >
              <input 
                type="text" 
                placeholder="Add note..." 
                value={newNote} 
                onChange={e => setNewNote(e.target.value)} 
                required 
              />
              <button type="submit">Add Note</button>
            </form>

            {/* Notes List */}
            <ul className="notes-list">
              {(contact.notes || []).map(note => (
                <li key={note.id} className={`item-container note-item ${editingNote === note.id ? 'editing' : ''}`}>
                  {editingNote === note.id ? (
                    // Edit mode
                    <div className="item-edit">
                      <div className="edit-form-row full-width">
                        <div className="edit-input-group">
                          <label>Note Content</label>
                          <textarea
                            value={editNoteData}
                            onChange={(e) => setEditNoteData(e.target.value)}
                            placeholder="Enter your note here..."
                            className="edit-textarea"
                            rows={4}
                          />
                        </div>
                      </div>
                      <div className="edit-actions">
                        <button
                          onClick={() => handleSaveNote(note.id)}
                          className="edit-button save"
                        >
                          <Save size={16} /> Save
                        </button>
                        <button
                          onClick={handleCancelEditNote}
                          className="edit-button cancel"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="item-view">
                      <div className="item-content" onClick={() => handleStartEditNote(note)}>
                        <p>{note.text}</p>
                        <div className="item-meta">
                          <span>Created: {formatDate(note.createdAt)}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button
                          onClick={() => handleStartEditNote(note)}
                          className="action-button edit"
                          title="Edit note"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="action-button delete"
                          title="Delete note"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {(contact.notes || []).length === 0 && (
                <div className="empty-state">
                  <p>No notes for this contact yet. Add one above to get started!</p>
                </div>
              )}
            </ul>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="activity-tab">
            <h3>Activity</h3>
            
            {/* Add New Activity Form */}
            <form
              onSubmit={handleAddActivity}
              style={{ display: 'flex', gap: 8, marginBottom: 16 }}
            >
              <select 
                value={activityType} 
                onChange={e => setActivityType(e.target.value)}
              >
                <option value="call">Log Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
              </select>
              <input 
                type="text" 
                placeholder="Activity note..." 
                value={activityNote} 
                onChange={e => setActivityNote(e.target.value)} 
                required 
              />
              <button type="submit">Add Activity</button>
            </form>

            {/* Activities List */}
            <ul className="activity-list">
              {(contact.activities || []).map(activity => (
                <li key={activity.id} className={`item-container activity-item ${editingActivity === activity.id ? 'editing' : ''}`}>
                  {editingActivity === activity.id ? (
                    // Edit mode
                    <div className="item-edit">
                      <div className="edit-form-row">
                        <div className="edit-input-group">
                          <label>Activity Type</label>
                          <select
                            value={editActivityData.type}
                            onChange={(e) => setEditActivityData({ ...editActivityData, type: e.target.value })}
                            className="edit-select"
                          >
                            <option value="call">Phone Call</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                            <option value="text">Text Message</option>
                          </select>
                        </div>
                      </div>
                      <div className="edit-form-row full-width">
                        <div className="edit-input-group">
                          <label>Activity Note</label>
                          <textarea
                            value={editActivityData.note}
                            onChange={(e) => setEditActivityData({ ...editActivityData, note: e.target.value })}
                            placeholder="Describe what happened during this activity..."
                            className="edit-textarea"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="edit-actions">
                        <button
                          onClick={() => handleSaveActivity(activity.id)}
                          className="edit-button save"
                        >
                          <Save size={16} /> Save
                        </button>
                        <button
                          onClick={handleCancelEditActivity}
                          className="edit-button cancel"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="item-view">
                      <div className="item-content" onClick={() => handleStartEditActivity(activity)}>
                        <h4>
                          <span className={`activity-type-badge ${activity.type}`}>
                            {activity.type}
                          </span>
                        </h4>
                        <p>{activity.note}</p>
                        <div className="item-meta">
                          <span>Created: {formatDate(activity.createdAt)}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button
                          onClick={() => handleStartEditActivity(activity)}
                          className="action-button edit"
                          title="Edit activity"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="action-button delete"
                          title="Delete activity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {(contact.activities || []).length === 0 && (
                <div className="empty-state">
                  <p>No activities for this contact yet. Add one above to get started!</p>
                </div>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDetailView;