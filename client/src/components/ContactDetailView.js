import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Plus,
  ChevronDown,
  Calendar,
  FileText
} from 'lucide-react';
import MovablePopup from './ui/MovablePopup';
import './ContactDetailView.css';

const ContactDetailView = ({
  contact,
  onBack,
  onContactUpdate,
  onNavigateToTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskCompletion,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity
}) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [popupState, setPopupState] = useState({ isOpen: false, type: '', title: '', editingItem: null });
  const [activeTab, setActiveTab] = useState('all');
  const [taskFilters, setTaskFilters] = useState({
    status: 'all', // 'all', 'completed', 'pending'
    priority: 'all' // 'all', 'low', 'medium', 'high', 'urgent'
  });
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const splitButtonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isDropdownOpen && splitButtonRef.current) {
      const rect = splitButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
    }
  }, [isDropdownOpen]);

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
    'CALL': '📞',
    'call': '📞',
    'EMAIL': '📧',
    'email': '📧',
    'WHATSAPP': '💬',
    'whatsapp': '💬',
    'MEETING': '🤝',
    'meeting': '🤝',
    'NOTE': '📝',
    'note': '📝',
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
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) {
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return '';
    }
  };

  // Format activity type for display
  const formatActivityType = (type) => {
    switch (type?.toUpperCase()) {
      case 'CALL':
        return 'Phone Call';
      case 'EMAIL':
        return 'Email';
      case 'WHATSAPP':
        return 'WhatsApp';
      case 'MEETING':
        return 'Meeting';
      case 'NOTE':
        return 'Note';
      default:
        return type || 'Activity';
    }
  };

  // Get all items combined and sorted by creation date
  const getAllItems = () => {
    const filteredTasks = (contact.tasks || []).filter(task => task.contactId === contact.id).map(task => ({ ...task, itemType: 'task' }));
    const filteredNotes = (contact.notes || []).filter(note => note.contactId === contact.id).map(note => ({ ...note, itemType: 'note' }));
    const filteredActivities = (contact.activities || []).filter(activity => activity.contactId === contact.id).map(activity => ({ ...activity, itemType: 'activity' }));
    return [...filteredTasks, ...filteredNotes, ...filteredActivities].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Get filtered items based on active tab
  const getFilteredItems = () => {
    switch (activeTab) {
      case 'tasks':
        let filteredTasks = (contact.tasks || []).filter(task => task.contactId === contact.id).map(task => ({ ...task, itemType: 'task' }));
        
        // Apply status filter
        if (taskFilters.status !== 'all') {
          filteredTasks = filteredTasks.filter(task => {
            if (taskFilters.status === 'completed') {
              return task.status === 'COMPLETED';
            } else if (taskFilters.status === 'pending') {
              return task.status !== 'COMPLETED';
            }
            return true;
          });
        }
        
        // Apply priority filter
        if (taskFilters.priority !== 'all') {
          filteredTasks = filteredTasks.filter(task => 
            task.priority?.toLowerCase() === taskFilters.priority.toLowerCase()
          );
        }
        
        return filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'notes':
        return (contact.notes || []).filter(note => note.contactId === contact.id).map(note => ({ ...note, itemType: 'note' }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'activities':
        return (contact.activities || []).filter(activity => activity.contactId === contact.id).map(activity => ({ ...activity, itemType: 'activity' }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return getAllItems();
    }
  };

  // Handle item click for editing
  const handleItemClick = (item) => {
    switch (item.itemType) {
      case 'task':
        editTask(item);
        break;
      case 'note':
        editNote(item);
        break;
      case 'activity':
        editActivity(item);
        break;
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

  const handleDeleteTaskClick = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(taskId);
    }
  };

  const handleDeleteNoteClick = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDeleteNote(noteId);
    }
  };

  const handleDeleteActivityClick = (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      onDeleteActivity(activityId);
    }
  };

  // Handle popup operations
  const openTaskPopup = () => {
    setPopupState({ isOpen: true, type: 'task', title: 'Add Task', editingItem: null });
    setIsDropdownOpen(false);
  };

  const openActivityPopup = () => {
    setPopupState({ isOpen: true, type: 'activity', title: 'Add Activity', editingItem: null });
    setIsDropdownOpen(false);
  };

  const openNotePopup = () => {
    setPopupState({ isOpen: true, type: 'note', title: 'Add Note', editingItem: null });
    setIsDropdownOpen(false);
  };

  const editTask = (task) => {
    setPopupState({ isOpen: true, type: 'task', title: 'Edit Task', editingItem: task });
  };

  const editNote = (note) => {
    setPopupState({ isOpen: true, type: 'note', title: 'Edit Note', editingItem: note });
  };

  const editActivity = (activity) => {
    setPopupState({ isOpen: true, type: 'activity', title: 'Edit Activity', editingItem: activity });
  };

  const closePopup = () => {
    setPopupState({ isOpen: false, type: '', title: '', editingItem: null });
  };

  // Handle form submissions
  const handleTaskCreate = async (newTask) => {
    try {
      // Call the onAddTask prop to update the contact data
      if (onAddTask) {
        await onAddTask(newTask);
      }
      console.log('Task created successfully:', newTask);
    } catch (error) {
      console.error('Error handling task creation:', error);
    }
  };

  const handleTaskUpdate = async (taskId, updatedTask) => {
    try {
      // Call the onUpdateTask prop to update the contact data
      if (onUpdateTask) {
        await onUpdateTask(taskId, updatedTask);
      }
      console.log('Task updated successfully:', updatedTask);
    } catch (error) {
      console.error('Error handling task update:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      if (onDeleteTask) {
        await onDeleteTask(taskId);
      }
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error handling task deletion:', error);
    }
  };

  const handleNoteCreate = async (newNote) => {
    try {
      // Call the onAddNote prop to update the contact data
      if (onAddNote) {
        await onAddNote(newNote);
      }
      console.log('Note created successfully:', newNote);
    } catch (error) {
      console.error('Error handling note creation:', error);
    }
  };

  const handleNoteUpdate = async (noteId, updatedNote) => {
    try {
      // Call the onUpdateNote prop to update the contact data
      if (onUpdateNote) {
        await onUpdateNote(noteId, updatedNote);
      }
      console.log('Note updated successfully:', updatedNote);
    } catch (error) {
      console.error('Error handling note update:', error);
    }
  };

  const handleNoteDelete = async (noteId) => {
    try {
      if (onDeleteNote) {
        await onDeleteNote(noteId);
      }
      console.log('Note deleted successfully');
    } catch (error) {
      console.error('Error handling note deletion:', error);
    }
  };

  const handleActivityCreate = async (newActivity) => {
    try {
      // Call the onAddActivity prop to update the contact data
      if (onAddActivity) {
        await onAddActivity(newActivity);
      }
      console.log('Activity created successfully:', newActivity);
    } catch (error) {
      console.error('Error handling activity creation:', error);
    }
  };

  const handleActivityUpdate = async (activityId, updatedActivity) => {
    try {
      // Call the onUpdateActivity prop to update the contact data
      if (onUpdateActivity) {
        await onUpdateActivity(activityId, updatedActivity);
      }
      console.log('Activity updated successfully:', updatedActivity);
    } catch (error) {
      console.error('Error handling activity update:', error);
    }
  };

  const handleActivityDelete = async (activityId) => {
    try {
      if (onDeleteActivity) {
        await onDeleteActivity(activityId);
      }
      console.log('Activity deleted successfully');
    } catch (error) {
      console.error('Error handling activity deletion:', error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    const task = contact.tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTaskData = {
        ...task,
        status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
      };
      await onUpdateTask(taskId, updatedTaskData);
    }
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

  const renderContactTypeField = () => {
    const contactTypeMap = {
      'BUYER': 'Buyer',
      'SELLER': 'Seller',
      'PAST_CLIENT': 'Past Client',
      'LEAD': 'Lead'
    };
    const displayValue = contactTypeMap[contact.contactType] || 'Lead';

    if (editingField === 'contactType') {
      return (
        <select
          value={contact.contactType || 'LEAD'}
          onChange={(e) => {
            onContactUpdate(contact.id, 'contactType', e.target.value);
            setEditingField(null);
          }}
          onBlur={() => setEditingField(null)}
          className="edit-input"
          autoFocus
        >
          <option value="LEAD">Lead</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
          <option value="PAST_CLIENT">Past Client</option>
        </select>
      );
    }

    return (
      <div
        className={`field-value ${!contact.contactType ? 'empty' : ''}`}
        onClick={() => setEditingField('contactType')}
      >
        {displayValue}
      </div>
    );
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
            {/* Only show Add Task and dropdown, remove Call and Email */}
            <div className="split-button-container" ref={splitButtonRef}>
              <button 
                className="action-btn primary split-button-main"
                onClick={(e) => {
                  e.preventDefault();
                  openTaskPopup();
                }}
              >
                <Plus size={16} />
                Add Task
              </button>
              <button 
                className="action-btn primary split-button-dropdown"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                <ChevronDown size={16} />
              </button>
            </div>
            {isDropdownOpen && createPortal(
              <div
                className="dropdown-menu-fixed"
                style={{
                  position: 'absolute',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  zIndex: 2147483647
                }}
              >
                <button 
                  className="dropdown-item"
                  onClick={(e) => {
                    e.preventDefault();
                    openActivityPopup();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Calendar size={16} />
                  Add Activity
                </button>
                <button 
                  className="dropdown-item"
                  onClick={(e) => {
                    e.preventDefault();
                    openNotePopup();
                    setIsDropdownOpen(false);
                  }}
                >
                  <FileText size={16} />
                  Add Note
                </button>
              </div>,
              document.body
            )}
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
                <MapPin className="field-icon" size={16} />
                <div className="field-content">
                  <div className="field-label">Suburb</div>
                  {renderEditableField('suburb', contact.suburb, 'Click to add suburb')}
                </div>
              </div>

              <div className="field-item">
                <Building className="field-icon" size={16} />
                <div className="field-content">
                  <div className="field-label">Contact Type</div>
                  {renderContactTypeField()}
                </div>
              </div>

              <div className="field-item">
                <Building className="field-icon" size={16} />
                <div className="field-content">
                  <div className="field-label">Lead Source</div>
                  {renderEditableField('leadSource', contact.leadSource, 'Click to add lead source')}
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
                    <div className={`activity-icon ${activity.type?.toLowerCase()}`}>
                      {activityIcons[activity.type?.toUpperCase()] || activityIcons[activity.type?.toLowerCase()] || '📝'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-type">
                        {activity.type === 'CALL' || activity.type === 'call' ? 'Phone Call' : 
                         activity.type === 'EMAIL' || activity.type === 'email' ? 'Email Sent' : 
                         activity.type === 'WHATSAPP' || activity.type === 'whatsapp' ? 'WhatsApp' :
                         activity.type === 'MEETING' || activity.type === 'meeting' ? 'Meeting' :
                         activity.type === 'NOTE' || activity.type === 'note' ? 'Note' :
                         activity.type}
                      </div>
                      <div className="activity-note">{activity.description}</div>
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
          <div className="contact-overview">
            <h2>Contact Overview</h2>
            <p>Contact details and information are displayed in the sidebar. Use the add button to create new items for this contact.</p>
            
            {/* Tabbed Items Section */}
            <div className="items-section">
              {/* Tab Navigation */}
              <div className="tab-navigation">
                <button 
                  className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Items
                </button>
                <button 
                  className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tasks')}
                >
                  Tasks ({contact.tasks?.length || 0})
                </button>
                <button 
                  className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  Notes ({contact.notes?.length || 0})
                </button>
                <button 
                  className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`}
                  onClick={() => setActiveTab('activities')}
                >
                  Activities ({contact.activities?.length || 0})
                </button>
              </div>

              {/* Task Filters - Only show when Tasks tab is active */}
              {activeTab === 'tasks' && (
                <div className="task-filters">
                  <div className="filter-group">
                    <label htmlFor="status-filter">Status:</label>
                    <select
                      id="status-filter"
                      value={taskFilters.status}
                      onChange={(e) => setTaskFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="all">All Tasks</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label htmlFor="priority-filter">Priority:</label>
                    <select
                      id="priority-filter"
                      value={taskFilters.priority}
                      onChange={(e) => setTaskFilters(prev => ({ ...prev, priority: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tab Content */}
              <div className="tab-content">
                {getFilteredItems().length > 0 ? (
                  <div className="items-list">
                    {getFilteredItems().map((item) => (
                      <div 
                        key={`${item.itemType}-${item.id}`} 
                        className={`item-card clickable ${item.itemType === 'task' && item.status === 'COMPLETED' ? 'completed-task' : ''}`}
                      >
                        <div className="item-header">
                          {item.itemType === 'task' && (
                            <label className="task-checkbox-label" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={item.status === 'COMPLETED'}
                                onChange={() => onToggleTaskCompletion && onToggleTaskCompletion(item.id)}
                                className="task-checkbox"
                              />
                            </label>
                          )}
                          <div className="item-type-indicator">
                            <span className={`item-type-badge ${item.itemType}`}>
                              {item.itemType === 'task' && '📋 Task'}
                              {item.itemType === 'note' && '📝 Note'}
                              {item.itemType === 'activity' && `${activityIcons[item.type?.toUpperCase()] || activityIcons[item.type?.toLowerCase()] || '📝'} ${formatActivityType(item.type)}`}
                            </span>
                          </div>
                          <div 
                            className="item-title"
                            onClick={() => handleItemClick(item)}
                          >
                            {item.itemType === 'note' ? item.content : item.title}
                          </div>
                          {item.itemType === 'task' && item.priority && (
                            <span className={`priority-badge ${item.priority?.toLowerCase()}`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        
                        {(item.description || item.content) && (
                          <div 
                            className="item-content"
                            onClick={() => handleItemClick(item)}
                          >
                            <div dangerouslySetInnerHTML={{ 
                              __html: (item.description || item.content)?.substring(0, 150) + 
                                     ((item.description || item.content)?.length > 150 ? '...' : '')
                            }} />
                          </div>
                        )}
                        
                        <div 
                          className="item-meta"
                          onClick={() => handleItemClick(item)}
                        >
                          {item.itemType === 'task' && item.dueDate && (
                            <span className="item-due-date">Due: {formatDate(item.dueDate)} • </span>
                          )}
                          <span className="item-created-time">{getRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-text">
                      {activeTab === 'all' ? 'No items yet' : 
                       activeTab === 'tasks' ? 'No tasks yet' :
                       activeTab === 'notes' ? 'No notes yet' :
                       'No activities yet'}
                    </div>
                    <div className="empty-state-subtext">
                      Click the Add Button to create your first {activeTab === 'all' ? 'item' : activeTab.slice(0, -1)}.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movable Popup */}
      <MovablePopup
        isOpen={popupState.isOpen}
        onClose={closePopup}
        title={popupState.title}
        type={popupState.type}
        contactId={contact.id}
        onTaskCreate={handleTaskCreate}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        onNoteCreate={handleNoteCreate}
        onNoteUpdate={handleNoteUpdate}
        onNoteDelete={handleNoteDelete}
        onActivityCreate={handleActivityCreate}
        onActivityUpdate={handleActivityUpdate}
        onActivityDelete={handleActivityDelete}
        editingItem={popupState.editingItem}
      >
        {/* Content is now handled by the type-specific forms */}
      </MovablePopup>
    </div>
  );
};

export default ContactDetailView;