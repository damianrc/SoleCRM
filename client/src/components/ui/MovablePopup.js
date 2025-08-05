import React, { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import TaskForm from './TaskForm';
import NoteForm from './NoteForm';
import ActivityForm from './ActivityForm';
import EnlargeIcon from './EnlargeIcon';
import './MovablePopup.css';

const MovablePopup = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  type, 
  contactId, 
  onTaskCreate, 
  onNoteCreate, 
  onActivityCreate,
  onTaskUpdate,
  onNoteUpdate,
  onActivityUpdate,
  onTaskDelete,
  onNoteDelete,
  onActivityDelete,
  editingItem = null
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 530, y: window.innerHeight - 320 });
  const [size, setSize] = useState({ width: 500, height: 240 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const popupRef = useRef(null);

  // Reset position to default when popup opens
  useEffect(() => {
    if (isOpen) {
      // Set different default sizes based on content type
      let defaultSize = { width: 500, height: 300 };
      
      if (type === 'task') {
        defaultSize = { width: 500, height: 260 };
      } else if (type === 'note') {
        defaultSize = { width: 500, height: 240 };
      } else if (type === 'activity') {
        defaultSize = { width: 500, height: 250 };
      }
      
      setPosition({ x: window.innerWidth - defaultSize.width - 30, y: window.innerHeight - defaultSize.height - 50 });
      setSize(defaultSize);
    }
  }, [isOpen, type]);

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Keep popup within window bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(250, resizeStart.width + deltaX);
        const newHeight = Math.max(180, resizeStart.height + deltaY);
        
        // Keep popup within window bounds
        const maxWidth = window.innerWidth - position.x;
        const maxHeight = window.innerHeight - position.y;
        
        setSize({
          width: Math.min(newWidth, maxWidth),
          height: Math.min(newHeight, maxHeight)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, position, size]);

  // Handle drag start
  const handleDragStart = (e) => {
    if (e.target.closest('.popup-resize-handle') || e.target.closest('.popup-close-btn')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle resize start
  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Handle enlarge/collapse
  const handleEnlarge = e => {
    e.stopPropagation();
    if (size.width < 900) {
      setSize({ width: 900, height: 600 });
      setPosition({
        x: Math.max(0, Math.floor((window.innerWidth - 900) / 2)),
        y: Math.max(0, Math.floor((window.innerHeight - 600) / 2))
      });
    } else {
      setSize({ width: 500, height: 300 });
      setPosition({
        x: Math.max(0, window.innerWidth - 500 - 30),
        y: Math.max(0, window.innerHeight - 300 - 50)
      });
    }
  };

  // Handle window resize to keep popup in bounds
  useEffect(() => {
    const handleWindowResize = () => {
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY))
      }));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [size]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="popup-backdrop" onClick={onClose} />
      
      {/* Popup */}
      <div
        ref={popupRef}
        className="movable-popup"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }}
      >
        {/* Header */}
        <div className="popup-header" onMouseDown={handleDragStart}>
          <div className="popup-title">
            <GripHorizontal size={16} className="drag-indicator" />
            {title}
          </div>
          <div className="popup-icons" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button 
              className="popup-enlarge-btn"
              onClick={handleEnlarge}
              title="Enlarge popup"
            >
              <EnlargeIcon size={16} />
            </button>
            <button 
              className="popup-close-btn"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="popup-content">
          {type === 'task' && (
            <TaskForm
              contactId={contactId}
              onSubmit={editingItem ? onTaskUpdate : onTaskCreate}
              onDelete={editingItem ? onTaskDelete : undefined}
              onCancel={onClose}
              initialData={editingItem}
              isEditing={!!editingItem}
            />
          )}
          {type === 'note' && (
            <NoteForm
              contactId={contactId}
              onSubmit={editingItem ? onNoteUpdate : onNoteCreate}
              onDelete={editingItem ? onNoteDelete : undefined}
              onCancel={onClose}
              initialData={editingItem}
              isEditing={!!editingItem}
            />
          )}
          {type === 'activity' && (
            <ActivityForm
              contactId={contactId}
              onSubmit={editingItem ? onActivityUpdate : onActivityCreate}
              onDelete={editingItem ? onActivityDelete : undefined}
              onCancel={onClose}
              initialData={editingItem}
              isEditing={!!editingItem}
            />
          )}
          {!type && children}
        </div>

        {/* Resize Handle */}
        <div 
          className="popup-resize-handle"
          onMouseDown={handleResizeStart}
        />
      </div>
    </>
  );
};

export default MovablePopup;
