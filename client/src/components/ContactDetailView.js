import React, { useState } from 'react';
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit,
  Save,
  X,
  Trash2,
  Plus
} from 'lucide-react';
import './ContactDetailView.css';

const ContactDetailView = ({
  contact,
  onBack,
  onContactUpdate,
  onNavigateToTasks
}) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Form states
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: ''
  });
  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState('call');
  const [activityNote, setActivityNote] = useState('');

  // Status mapping for clean display
  const statusMapping = {
    'NEW': 'new',
    'CONTACTED': 'contacted',
    'QUALIFIED': 'qualified',
    'PROPOSAL': 'proposal',
    'NEGOTIATION': 'negotiation',
    'CLOSED_WON': 'closed_won',
    'CLOSED_LOST': 'closed_lost'
  };

  const priorityMapping = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'urgent'
  };

  const activityIcons = {
    'call': '📞',
    'email': '📧',
    'whatsapp': '💬',
    'text': '💬'
  };

  // Get contact initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch {
      return dateString;
    }
  };

  // Handle inline editing
  const handleStartEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = (field) => {
    const trimmedValue = editValue.trim();
    if (trimmedValue !== contact[field]) {
      onContactUpdate(contact.id, field, trimmedValue);
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyPress = (e, field) => {
    if (e.key === 'Enter') {
      handleSaveEdit(field);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Handle form submissions
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const task = {
      id: Date.now(),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [...(contact.tasks || []), task];
    onContactUpdate(contact.id, 'tasks', updatedTasks);

    setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const note = {
      id: Date.now(),
      text: newNote.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...(contact.notes || []), note];
    onContactUpdate(contact.id, 'notes', updatedNotes);
    setNewNote('');
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!activityNote.trim()) return;

    const activity = {
      id: Date.now(),
      type: activityType,
      note: activityNote.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedActivities = [...(contact.activities || []), activity];
    onContactUpdate(contact.id, 'activities', updatedActivities);

    setActivityType('call');
    setActivityNote('');
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = contact.tasks.filter(task => task.id !== taskId);
      onContactUpdate(contact.id, 'tasks', updatedTasks);
    }
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = contact.notes.filter(note => note.id !== noteId);
      onContactUpdate(contact.id, 'notes', updatedNotes);
    }
  };

  const handleDeleteActivity = (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      const updatedActivities = contact.activities.filter(activity => activity.id !== activityId);
      onContactUpdate(contact.id, 'activities', updatedActivities);
    }
  };

  const handleCompleteTask = (taskId) => {
    const updatedTasks = contact.tasks.map(task =>
      task.id === taskId ? { ...task, status: 'COMPLETED' } : task
    );
    onContactUpdate(contact.id, 'tasks', updatedTasks);
  };

  const handleStatusChange = (newStatus) => {
    onContactUpdate(contact.id, 'status', newStatus);
  };

  const renderEditableField = (field, value, placeholder = 'Click to add') => {
    if (editingField === field) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSaveEdit(field)}
          onKeyDown={(e) => handleKeyPress(e, field)}
          className="edit-input"
          autoFocus
        />
      );
    }

    return (
      <div
        className={`field-value ${!value ? 'empty' : ''}`}
        onClick={() => handleStartEdit(field, value)}
      >
        {value || placeholder}
      </div>
    );
  };

  const renderStatusBadge = () => {
    const statusClass = statusMapping[contact.status] || 'new';
    const statusText = contact.status?.toLowerCase().replace('_', ' ') || 'New';

    if (editingField === 'status') {
      return (
        <select
          value={contact.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          onBlur={() => setEditingField(null)}
          className="edit-input"
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
      );
    }

    return (
      <span
        className={`status-badge ${statusClass}`}
        onClick={() => setEditingField('status')}
      >
        {statusText}
      </span>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <div>
            {/* Add Task Form */}
            <div className="add-form">
              <form onSubmit={handleAddTask}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Task Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 140px' }}>
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: '0 0 140px' }}>
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Add task description (optional)"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Create Task
                  </button>
                </div>
              </form>
            </div>

            {/* Tasks List */}
            <div className="items-list">
              {contact.tasks && contact.tasks.length > 0 ? (
                contact.tasks.map((task) => (
                  <div key={task.id} className="item-card">
                    <div className="item-header">
                      <div>
                        <div className="item-title">{task.title}</div>
                        <div className="item-meta">
                          <span className={`priority-dot ${priorityMapping[task.priority]?.toLowerCase() || 'medium'}`}></span>
                          {task.priority} Priority
                          <span>•</span>
                          Due: {formatDate(task.dueDate)}
                          <span>•</span>
                          Created {getRelativeTime(task.createdAt)}
                        </div>
                      </div>
                      <div className="item-actions">
                        <button className="item-action" onClick={() => console.log('Edit task')}>
                          Edit
                        </button>
                        <button 
                          className="item-action" 
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={task.status === 'COMPLETED'}
                        >
                          {task.status === 'COMPLETED' ? 'Completed' : 'Complete'}
                        </button>
                        <button className="item-action" onClick={() => handleDeleteTask(task.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <div className="item-content">{task.description}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-title">No tasks yet</div>
                  <div className="empty-state-text">Create your first task to get started</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div>
            {/* Add Note Form */}
            <div className="add-form">
              <form onSubmit={handleAddNote}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Note</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Add Note
                  </button>
                </div>
              </form>
            </div>

            {/* Notes List */}
            <div className="items-list">
              {contact.notes && contact.notes.length > 0 ? (
                contact.notes.map((note) => (
                  <div key={note.id} className="item-card">
                    <div className="item-header">
                      <div>
                        <div className="item-meta">
                          Added {getRelativeTime(note.createdAt)}
                        </div>
                      </div>
                      <div className="item-actions">
                        <button className="item-action" onClick={() => handleDeleteNote(note.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="item-content">{note.text}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-title">No notes yet</div>
                  <div className="empty-state-text">Add your first note about this contact</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'activity':
        return (
          <div>
            {/* Add Activity Form */}
            <div className="add-form">
              <form onSubmit={handleAddActivity}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: '0 0 140px' }}>
                    <label className="form-label">Activity Type</label>
                    <select
                      className="form-select"
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                    >
                      <option value="call">Phone Call</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="text">Text Message</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Activity Note</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="What happened during this activity?"
                      value={activityNote}
                      onChange={(e) => setActivityNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Log Activity
                  </button>
                </div>
              </form>
            </div>

            {/* Activity List */}
            <div className="items-list">
              {contact.activities && contact.activities.length > 0 ? (
                contact.activities.map((activity) => (
                  <div key={activity.id} className="item-card">
                    <div className="item-header">
                      <div>
                        <div className="item-title">
                          {activityIcons[activity.type]} {activity.type === 'call' ? 'Phone Call' : 
                           activity.type === 'email' ? 'Email' : 
                           activity.type === 'whatsapp' ? 'WhatsApp' : 'Text Message'}
                        </div>
                        <div className="item-meta">
                          {getRelativeTime(activity.createdAt)}
                        </div>
                      </div>
                      <div className="item-actions">
                        <button className="item-action" onClick={() => handleDeleteActivity(activity.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="item-content">{activity.note}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-title">No activities yet</div>
                  <div className="empty-state-text">Log your first interaction with this contact</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="empty-state">
            <div className="empty-state-title">Files feature coming soon</div>
            <div className="empty-state-text">File management will be available in a future update</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="contact-detail-view">
      {/* Header */}
      <div className="detail-header">
        <div className="header-top">
          <button className="back-button" onClick={onBack}>
            <ChevronLeft size={16} />
            Back to Contacts
          </button>
        </div>

        <div className="header-main">
          <div className="contact-identity">
            <div className="contact-avatar">
              {getInitials(contact.name)}
            </div>
            <div className="contact-info">
              <h1 className="contact-name">
                {editingField === 'name' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveEdit('name')}
                    onKeyDown={(e) => handleKeyPress(e, 'name')}
                    className="edit-input"
                    autoFocus
                  />
                ) : (
                  <span onClick={() => handleStartEdit('name', contact.name)}>
                    {contact.name}
                  </span>
                )}
              </h1>
              <div className="contact-meta">
                {renderStatusBadge()}
                <span>•</span>
                <span>Last contact: {getRelativeTime(contact.lastContactDate)}</span>
                <span>•</span>
                <span>Created: {getRelativeTime(contact.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button className="action-btn">
              <Phone size={16} />
              Call
            </button>
            <button className="action-btn">
              <Mail size={16} />
              Email
            </button>
            <button className="action-btn primary">
              <Plus size={16} />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Sidebar */}
        <div className="detail-sidebar">
          {/* Contact Information */}
          <div className="sidebar-section">
            <h3>Contact Information</h3>
            <div className="contact-fields">
              <div className="field-item">
                <Mail className="field-icon" size={16} />
                <div className="field-content">
                  <div className="field-label">Email</div>
                  {renderEditableField('email', contact.email, 'Click to add email')}
                </div>
              </div>

              <div className="field-item">
                <Phone className="field-icon" size={16} />
                <div className="field-content">
                  <div className="field-label">Phone</div>
                  {renderEditableField('phone', contact.phone, 'Click to add phone')}
                </div>
              </div>

              <div className="field-item">
                <MapPin className="field-icon" size={16} />
                <div className="field-content">
                  <div className="field-label">Address</div>
                  {renderEditableField('address', contact.address, 'Click to add address')}
                </div>
              </div>

              <div className="field-item">
                <Building className="field-icon" size={16} />
                <div className="field-content">
                  <div className="field-label">Company</div>
                  {renderEditableField('company', contact.company, 'Click to add company')}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="sidebar-section">
            <h3>Recent Activity</h3>
            <div className="recent-activity">
              {contact.activities && contact.activities.length > 0 ? (
                contact.activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon ${activity.type}`}>
                      {activityIcons[activity.type]}
                    </div>
                    <div className="activity-content">
                      <div className="activity-type">
                        {activity.type === 'call' ? 'Phone Call' : 
                         activity.type === 'email' ? 'Email Sent' : 
                         activity.type === 'whatsapp' ? 'WhatsApp' : 'Text Message'}
                      </div>
                      <div className="activity-note">{activity.note}</div>
                      <div className="activity-time">{getRelativeTime(activity.createdAt)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-text">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="detail-main">
          {/* Tabs */}
          <div className="detail-tabs">
            <button
              className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              Tasks
            </button>
            <button
              className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
            <button
              className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
            <button
              className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              Files
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailView;