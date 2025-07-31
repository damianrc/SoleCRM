import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User,
  Square,
  Loader,
  CheckSquare,
  XCircle
} from 'lucide-react';
import './TasksView.css';

/**
 * TasksView Component
 * 
 * This component displays all tasks aggregated from all contacts.
 * Features include:
 * - Search functionality to find specific tasks
 * - Filter by status and priority
 * - Task status indicators with icons
 * - Priority-based color coding
 * - Contact association display
 * 
 * Props:
 * - contacts: Array of all contacts (to extract tasks from)
 * - onTaskUpdate: Function to update a task's properties
 */
const TasksView = ({ contacts, onTaskUpdate }) => {
  // Search and filter states
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');

  // Priority color mapping for visual distinction
  const priorityColors = {
    LOW: 'text-gray-500',
    MEDIUM: 'text-blue-500',
    HIGH: 'text-orange-500',
    URGENT: 'text-red-500'
  };

  // Task status icons for visual representation
  const taskStatusComponents = {
    PENDING: <Square size={16} />,
    IN_PROGRESS: <Loader size={16} className="spin" />,
    COMPLETED: <CheckSquare size={16} />,
    CANCELLED: <XCircle size={16} />
  };

  /**
   * Extract and flatten all tasks from all contacts
   * Each task gets enhanced with contact information
   */
  const getAllTasks = () => {
    return contacts.flatMap(contact => 
      (contact.tasks || []).map(task => ({
        ...task,
        contactName: contact.name,
        contactId: contact.id
      }))
    );
  };

  /**
   * Filter tasks based on search term, status, and priority
   */
  const getFilteredTasks = () => {
    const allTasks = getAllTasks();
    
    return allTasks.filter(task => {
      // Search filter - check task title, description, and contact name
      const matchesSearch = !taskSearchTerm || 
        task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.contactName.toLowerCase().includes(taskSearchTerm.toLowerCase());

      // Status filter
      const matchesStatus = !taskStatusFilter || task.status === taskStatusFilter;

      // Priority filter
      const matchesPriority = !taskPriorityFilter || task.priority === taskPriorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  /**
   * Format date string for display
   * @param {string} dateString - ISO date string or date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  /**
   * Get task status badge styling
   * @param {string} status - Task status
   * @returns {string} CSS classes for status badge
   */
  const getStatusBadgeClass = (status) => {
    const statusStyles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return `status-badge ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`;
  };

  /**
   * Handle task status update
   * @param {Object} task - Task to update
   * @param {string} newStatus - New status value
   */
  const handleStatusUpdate = (task, newStatus) => {
    // Find the contact that owns this task and update it
    const updatedTask = { ...task, status: newStatus };
    onTaskUpdate(task.contactId, task.id, updatedTask);
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="tasks-view">
      {/* Header */}
      <div className="tasks-header">
        <h2>All Tasks</h2>
        <p className="task-count">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="tasks-filters">
        {/* Search Input */}
        <div className="filter-group">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={taskSearchTerm}
            onChange={(e) => setTaskSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={taskStatusFilter}
            onChange={(e) => setTaskStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="filter-group">
          <select
            value={taskPriorityFilter}
            onChange={(e) => setTaskPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-list">
        {filteredTasks.length === 0 ? (
          /* Empty State */
          <div className="empty-state">
            <p>No tasks found.</p>
            {taskSearchTerm || taskStatusFilter || taskPriorityFilter ? (
              <p>Try adjusting your search or filters.</p>
            ) : (
              <p>Tasks will appear here when you add them to contacts.</p>
            )}
          </div>
        ) : (
          /* Task Items */
          filteredTasks.map(task => (
            <div key={`${task.contactId}-${task.id}`} className="task-item">
              {/* Task Header */}
              <div className="task-header">
                <div className="task-title-section">
                  {/* Status Icon */}
                  <span className="task-status-icon">
                    {taskStatusComponents[task.status] || taskStatusComponents.PENDING}
                  </span>
                  
                  {/* Task Title */}
                  <h3 className="task-title">{task.title}</h3>
                  
                  {/* Priority Badge */}
                  <span className={`task-priority ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>

                {/* Status Dropdown */}
                <select
                  value={task.status}
                  onChange={(e) => handleStatusUpdate(task, e.target.value)}
                  className="status-select"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Task Description */}
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}

              {/* Task Meta Information */}
              <div className="task-meta">
                {/* Associated Contact */}
                <div className="meta-item">
                  <User size={14} />
                  <span>Contact: {task.contactName}</span>
                </div>

                {/* Due Date */}
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Due: {formatDate(task.dueDate)}</span>
                </div>

                {/* Created Date */}
                {task.createdAt && (
                  <div className="meta-item">
                    <Clock size={14} />
                    <span>Created: {formatDate(task.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TasksView;