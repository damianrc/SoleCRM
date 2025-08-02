import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flexRender, createColumnHelper } from '@tanstack/react-table';
import { useContactsTable } from '../hooks/useContactsTable';
import { Plus, Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { getAuthHeaders, getUserId } from '../utils/auth';

const TasksPage = () => {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    contactId: ''
  });

  const queryClient = useQueryClient();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // Fetch tasks data
  const {
    data: tasksData = [],
    isLoading: isTasksLoading,
    error: tasksError,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tasks || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch contacts for task assignment
  const {
    data: contactsData = { contacts: [] }
  } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const userId = getUserId();
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...taskData, userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add task: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsAddTaskModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        contactId: ''
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Transform tasks data to include contact names
  const tasksWithContacts = useMemo(() => {
    return tasksData.map(task => {
      const contact = contactsData.contacts.find(c => c.id === task.contactId);
      return {
        ...task,
        contactName: contact?.name || 'Unknown Contact'
      };
    });
  }, [tasksData, contactsData.contacts]);

  // Table columns
  const columnHelper = createColumnHelper();
  const columns = useMemo(() => [
    // Selection column
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomeRowsSelected();
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 50,
      enableResizing: false,
    },

    // Title
    columnHelper.accessor('title', {
      header: 'Task',
      cell: ({ getValue, row }) => {
        const isCompleted = row.original.status === 'COMPLETED';
        return (
          <div className={`task-title ${isCompleted ? 'completed' : ''}`}>
            {isCompleted && <CheckCircle size={16} className="completed-icon" />}
            <span>{getValue()}</span>
          </div>
        );
      },
      size: 250,
    }),

    // Contact
    columnHelper.accessor('contactName', {
      header: 'Contact',
      cell: ({ getValue }) => (
        <div className="contact-name">
          <User size={14} />
          <span>{getValue()}</span>
        </div>
      ),
      size: 150,
    }),

    // Priority
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: ({ getValue }) => (
        <span className={`priority-badge priority-${getValue()?.toLowerCase()}`}>
          {getValue()}
        </span>
      ),
      size: 100,
    }),

    // Status
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue, row }) => (
        <select
          value={getValue()}
          onChange={(e) => updateTaskMutation.mutate({ 
            taskId: row.original.id, 
            updates: { status: e.target.value } 
          })}
          className={`status-select status-${getValue()?.toLowerCase()}`}
          disabled={updateTaskMutation.isPending}
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      ),
      size: 130,
    }),

    // Due Date
    columnHelper.accessor('dueDate', {
      header: 'Due Date',
      cell: ({ getValue }) => {
        const dueDate = getValue();
        if (!dueDate) return <span className="text-muted">No due date</span>;
        
        const date = new Date(dueDate);
        const isOverdue = date < new Date() && getValue() !== 'COMPLETED';
        
        return (
          <div className={`due-date ${isOverdue ? 'overdue' : ''}`}>
            <Calendar size={14} />
            <span>{date.toLocaleDateString()}</span>
            {isOverdue && <AlertCircle size={14} className="overdue-icon" />}
          </div>
        );
      },
      size: 120,
    }),

    // Actions
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="task-actions">
          <button
            onClick={() => updateTaskMutation.mutate({ 
              taskId: row.original.id, 
              updates: { status: row.original.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } 
            })}
            className={`action-btn ${row.original.status === 'COMPLETED' ? 'mark-pending' : 'mark-complete'}`}
            disabled={updateTaskMutation.isPending}
          >
            {row.original.status === 'COMPLETED' ? 'Mark Pending' : 'Complete'}
          </button>
          <button
            onClick={() => deleteTaskMutation.mutate(row.original.id)}
            className="action-btn delete-btn"
            disabled={deleteTaskMutation.isPending}
          >
            Delete
          </button>
        </div>
      ),
      size: 150,
      enableResizing: false,
    },
  ], [columnHelper, updateTaskMutation, deleteTaskMutation]);

  // Table hook
  const table = useContactsTable(tasksWithContacts, columns);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    try {
      await addTaskMutation.mutateAsync(newTask);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  if (tasksError) {
    return (
      <div className="tasks-page-container">
        <div className="error-container">
          <h2>⚠️ Error Loading Tasks</h2>
          <p>{tasksError.message}</p>
          <button onClick={() => refetchTasks()} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page-container">
      <div className="tasks-header">
        <div className="tasks-title-section">
          <h1 className="tasks-title">Tasks</h1>
          <span className="tasks-count">
            {isTasksLoading ? 'Loading...' : `${tasksWithContacts.length} tasks`}
          </span>
        </div>
        
        <button 
          onClick={() => setIsAddTaskModalOpen(true)}
          className="btn btn-primary"
          disabled={isTasksLoading}
        >
          <Plus size={16} className="me-1" />
          Add Task
        </button>
      </div>

      <div className="tasks-content">
        {isTasksLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="tasks-table">
              <thead>
                {table.table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        {...{
                          onClick: header.column.getCanSort()
                            ? header.column.getToggleSortingHandler()
                            : undefined,
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && ' ▲'}
                        {header.column.getIsSorted() === 'desc' && ' ▼'}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={row.getIsSelected() ? 'selected-row' : ''}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {tasksWithContacts.length === 0 && (
              <div className="empty-state">
                <Clock size={48} />
                <h3>No tasks yet</h3>
                <p>Create your first task to get started.</p>
                <button 
                  onClick={() => setIsAddTaskModalOpen(true)}
                  className="btn btn-primary"
                >
                  Add Task
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {table.paginationState.pageCount > 1 && (
        <div className="tasks-pagination">
          <div className="pagination-controls">
            <button
              onClick={table.paginationActions.previousPage}
              disabled={!table.paginationState.canPreviousPage}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {table.paginationState.pageIndex + 1} of {table.paginationState.pageCount}
            </span>
            <button
              onClick={table.paginationActions.nextPage}
              disabled={!table.paginationState.canNextPage}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTaskModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add New Task</h2>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                  placeholder="Enter task title"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assign to Contact</label>
                <select
                  value={newTask.contactId}
                  onChange={(e) => setNewTask({...newTask, contactId: e.target.value})}
                >
                  <option value="">Select a contact</option>
                  {contactsData.contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={addTaskMutation.isPending}
                >
                  {addTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .tasks-page-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .tasks-title-section {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .tasks-title {
          font-size: 28px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .tasks-count {
          font-size: 14px;
          color: #6b7280;
        }

        .tasks-content {
          flex: 1;
          overflow: hidden;
          background: white;
        }

        .table-wrapper {
          height: 100%;
          overflow: auto;
        }

        .tasks-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tasks-table th,
        .tasks-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .tasks-table th {
          background: #f9fafb;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }

        .tasks-table th:hover {
          background: #f3f4f6;
        }

        .tasks-table tbody tr:hover {
          background: #f9fafb;
        }

        .selected-row {
          background: #eff6ff !important;
        }

        .task-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .task-title.completed {
          opacity: 0.6;
          text-decoration: line-through;
        }

        .completed-icon {
          color: #10b981;
        }

        .contact-name {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .priority-low {
          background: #d1fae5;
          color: #065f46;
        }

        .priority-medium {
          background: #fef3c7;
          color: #92400e;
        }

        .priority-high {
          background: #fed7d7;
          color: #991b1b;
        }

        .priority-urgent {
          background: #fecaca;
          color: #991b1b;
          animation: pulse 2s infinite;
        }

        .status-select {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          background: white;
        }

        .due-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .due-date.overdue {
          color: #dc2626;
        }

        .overdue-icon {
          color: #dc2626;
        }

        .text-muted {
          color: #9ca3af;
        }

        .task-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .mark-complete {
          background: #10b981;
          color: white;
        }

        .mark-complete:hover {
          background: #059669;
        }

        .mark-pending {
          background: #f59e0b;
          color: white;
        }

        .mark-pending:hover {
          background: #d97706;
        }

        .delete-btn {
          background: #ef4444;
          color: white;
        }

        .delete-btn:hover {
          background: #dc2626;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #6b7280;
        }

        .empty-state h3 {
          margin: 16px 0 8px;
          color: #374151;
        }

        .empty-state p {
          margin-bottom: 24px;
        }

        .tasks-pagination {
          padding: 16px 32px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
        }

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #3b82f6;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          color: #6b7280;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h2 {
          margin: 0 0 24px;
          font-size: 20px;
          color: #1f2937;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          text-align: center;
        }

        .error-container h2 {
          color: #dc2626;
          margin-bottom: 16px;
        }

        .error-container p {
          color: #6b7280;
          margin-bottom: 24px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @media (max-width: 768px) {
          .tasks-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 16px 20px;
          }

          .tasks-title-section {
            justify-content: space-between;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .modal-content {
            margin: 10px;
            padding: 16px;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default TasksPage;
