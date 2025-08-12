import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { ChevronDown, Plus, Edit, Trash2, Check, X, Tag, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAuthHeaders } from '../utils/auth';
// import { useUpdateUserContactProperties } from '../hooks/useUserContactProperties'; // Commented out to prevent interference
import './CustomProperties.css';


// Sortable Option Item for dnd-kit
function SortableOption({ id, idx, opt, editingIdx, editValue, setEditValue, setEditingIdx, handleSaveEdit, handleCancelEdit, onRename, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? 'var(--color-hover-bg)' : undefined
  };

  return (
    <div ref={setNodeRef} style={style} className="option-item" {...attributes}>
      {editingIdx === idx ? (
        <div className="option-edit">
          <span {...listeners} style={{ cursor: 'grab', marginRight: 8, display: 'flex', alignItems: 'center' }} title="Drag to reorder">
            <GripVertical size={16} />
          </span>
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
            className="option-input"
            autoFocus
          />
          <div className="option-actions">
            <button
              onClick={handleSaveEdit}
              className="action-btn save-btn"
              title="Save"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="action-btn cancel-btn"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="option-display">
          <span {...listeners} style={{ cursor: 'grab', marginRight: 8, display: 'flex', alignItems: 'center' }} title="Drag to reorder">
            <GripVertical size={16} />
          </span>
          <span className="option-text">{opt}</span>
          <div className="option-actions">
            <button
              onClick={() => {
                setEditingIdx(idx);
                setEditValue(opt);
              }}
              className="action-btn edit-btn"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(idx)}
              className="action-btn delete-btn"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const PropertyEditor = ({ label, options, onAdd, onRename, onDelete, onReorder, multiSelect, icon, rawOptions }) => {
  const [newOption, setNewOption] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleAddOption = () => {
    if (newOption.trim()) {
      onAdd(newOption.trim());
      setNewOption('');
    }
  };

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      onRename(editingIdx, editValue.trim());
      setEditingIdx(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditValue('');
  };

  // dnd-kit drag end handler
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setIsReordering(false);
      return;
    }

    const oldIdx = parseInt(active.id);
    const newIdx = parseInt(over.id);
    
    setIsReordering(true);
    
    try {
      // Reorder the raw option objects and update backend
      if (rawOptions && Array.isArray(rawOptions)) {
        const reorderedRaw = arrayMove([...rawOptions], oldIdx, newIdx).map((opt, idx) => ({
          // Ensure we preserve the original option structure
          id: opt.id || null,
          label: opt.label || opt.value || opt,
          value: opt.value || (typeof opt === 'string' ? opt.toLowerCase().replace(/\s+/g, '_') : ''),
          sortOrder: idx,
          isActive: opt.isActive !== undefined ? opt.isActive : true
        }));
        
        console.log('Reordering options:', { oldIdx, newIdx, reorderedRaw });
        await onReorder(reorderedRaw);
      }
    } catch (error) {
      console.error('Error reordering options:', error);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="property-editor-container">
      <div className="property-editor">
        <div className="property-header">
          <div className="property-title">
            {icon}
            <h3>{label}</h3>
            {isReordering && <span className="reordering-indicator">Reordering...</span>}
          </div>
          {multiSelect && (
            <span className="multiselect-badge">
              Multi-select
            </span>
          )}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={options.map((_, idx) => idx)} strategy={verticalListSortingStrategy}>
            <div className="options-list">
              {options.length === 0 ? (
                <div className="empty-state">
                  <span>No {label.toLowerCase()} options yet</span>
                </div>
              ) : (
                options.map((opt, idx) => (
                  <SortableOption
                    key={`${opt}-${idx}`}
                    id={idx}
                    idx={idx}
                    opt={opt}
                    editingIdx={editingIdx}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    setEditingIdx={setEditingIdx}
                    handleSaveEdit={handleSaveEdit}
                    handleCancelEdit={handleCancelEdit}
                    onRename={onRename}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        <div className="add-option">
          <input
            type="text"
            placeholder={`Add new ${label.toLowerCase()} option`}
            value={newOption}
            onChange={e => setNewOption(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddOption();
            }}
            className="add-option-input"
          />
          <button
            onClick={handleAddOption}
            className="add-option-btn"
            disabled={!newOption.trim() || isReordering}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomProperties = () => {
  const [customProperties, setCustomProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [propsError, setPropsError] = useState(null);
  // const updateMutation = useUpdateUserContactProperties(); // Commented out to prevent interference
  const [selectedProperty, setSelectedProperty] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPropType, setNewPropType] = useState('TEXT');
  const [newPropName, setNewPropName] = useState('');
  const [newPropFieldKey, setNewPropFieldKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isReordering, setIsReordering] = useState(false);

  // Fetch all custom properties for the user
  React.useEffect(() => {
    async function fetchProps() {
      setLoadingProps(true);
      setPropsError(null);
      try {
        const res = await fetch('/api/custom-properties', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch custom properties');
        const props = await res.json();
        console.log('EFFECT: Fetched properties from server:', props);
        setCustomProperties(props);
      } catch (err) {
        setPropsError(err.message);
      } finally {
        setLoadingProps(false);
      }
    }
    fetchProps();
  }, []);

  // Debug effect to track customProperties changes
  React.useEffect(() => {
    console.log('EFFECT: customProperties state changed:', customProperties);
  }, [customProperties]);

  // Prevent external updates during reordering
  React.useEffect(() => {
    if (isReordering) {
      console.log('BLOCKED: External update blocked due to active reordering');
      return;
    }
  }, [customProperties, isReordering]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Check if there are any React Query cache invalidations happening
  React.useEffect(() => {
    if (window.queryClient) {
      const originalInvalidateQueries = window.queryClient.invalidateQueries;
      window.queryClient.invalidateQueries = function(...args) {
        console.log('🚨 REACT QUERY INVALIDATION DETECTED:', args);
        if (isReordering) {
          console.log('🛑 BLOCKING invalidateQueries during reordering');
          return Promise.resolve();
        }
        return originalInvalidateQueries.apply(this, args);
      };
      
      return () => {
        window.queryClient.invalidateQueries = originalInvalidateQueries;
      };
    }
  }, [isReordering]);

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Build dropdown options from customProperties
  const propertyOptions = customProperties.map(prop => ({
    value: prop.fieldKey,
    label: prop.name,
    icon: <Tag size={16} />,
    field: prop.fieldKey,
    multiSelect: prop.fieldType === 'MULTISELECT',
    raw: prop
  }));

  const selectedPropertyData = propertyOptions.find(p => p.value === selectedProperty);

  // Handler for creating a new property
  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/custom-properties', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPropName,
          fieldKey: newPropFieldKey,
          fieldType: newPropType
        })
      });
      if (!res.ok) {
        let errMsg = 'Failed to create property';
        try {
          const errJson = await res.json();
          errMsg = errJson.error || errMsg;
          if (errJson.details) {
            errMsg += ': ' + errJson.details.join(', ');
          }
        } catch {}
        throw new Error(errMsg);
      }
      
      const newProperty = await res.json();
      
      // Update local state instead of reloading
      setCustomProperties(prev => [...prev, newProperty]);
      setSelectedProperty(newProperty.fieldKey);
      
      // Reset form
      setShowCreateModal(false);
      setNewPropName('');
      setNewPropFieldKey('');
      setNewPropType('TEXT');
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Extract option labels for display (since options are objects with label/value)
  const getOptionLabels = (property) => {
    if (!property.options || !Array.isArray(property.options)) return [];
    // Sort by sortOrder if available, otherwise maintain original order
    const sortedOptions = [...property.options].sort((a, b) => {
      const aOrder = a.sortOrder !== undefined ? a.sortOrder : 999;
      const bOrder = b.sortOrder !== undefined ? b.sortOrder : 999;
      return aOrder - bOrder;
    });
    return sortedOptions.map(opt => typeof opt === 'string' ? opt : opt.label || opt.value || opt);
  };

  // Handlers for property option management (for DROPDOWN/MULTISELECT properties)
  const handleAddOption = async (option) => {
    if (!selectedPropertyData) return;
    try {
      const currentOptions = selectedPropertyData.raw.options || [];
      const newOption = {
        label: option,
        value: option.toLowerCase().replace(/\s+/g, '_'),
        sortOrder: currentOptions.length,
        isActive: true
      };
      const updatedOptions = [...currentOptions, newOption];
      
      console.log('Adding option:', { newOption, updatedOptions });
      
      const res = await fetch(`/api/custom-properties/${selectedPropertyData.raw.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: updatedOptions
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to add option - Response:', errorText);
        throw new Error('Failed to add option');
      }
      const updatedProperty = await res.json();
      setCustomProperties(prev => 
        prev.map(prop => 
          prop.id === updatedProperty.id ? updatedProperty : prop
        )
      );
    } catch (err) {
      console.error('Failed to add option:', err);
    }
  };

  const handleRenameOption = async (index, newValue) => {
    if (!selectedPropertyData) return;
    try {
      const currentOptions = selectedPropertyData.raw.options || [];
      const updatedOptions = currentOptions.map((opt, idx) => {
        if (idx === index) {
          return {
            ...opt,
            label: newValue,
            value: newValue.toLowerCase().replace(/\s+/g, '_')
          };
        }
        return opt;
      });
      
      console.log('Renaming option:', { index, newValue, updatedOptions });
      
      const res = await fetch(`/api/custom-properties/${selectedPropertyData.raw.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: updatedOptions
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to rename option - Response:', errorText);
        throw new Error('Failed to rename option');
      }
      const updatedProperty = await res.json();
      setCustomProperties(prev => 
        prev.map(prop => 
          prop.id === updatedProperty.id ? updatedProperty : prop
        )
      );
    } catch (err) {
      console.error('Failed to rename option:', err);
    }
  };

  const handleDeleteOption = async (index) => {
    if (!selectedPropertyData) return;
    try {
      const currentOptions = selectedPropertyData.raw.options || [];
      const updatedOptions = currentOptions
        .filter((_, idx) => idx !== index)
        .map((opt, idx) => ({
          ...opt,
          sortOrder: idx // Reorder after deletion
        }));
      
      console.log('Deleting option:', { index, updatedOptions });
      
      const res = await fetch(`/api/custom-properties/${selectedPropertyData.raw.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: updatedOptions
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to delete option - Response:', errorText);
        throw new Error('Failed to delete option');
      }
      const updatedProperty = await res.json();
      setCustomProperties(prev => 
        prev.map(prop => 
          prop.id === updatedProperty.id ? updatedProperty : prop
        )
      );
    } catch (err) {
      console.error('Failed to delete option:', err);
    }
  };

  // Handler for reordering options (now expects full option objects)
  const handleReorderOptions = async (reorderedRawOptions) => {
    if (!selectedPropertyData) return;
    
    setIsReordering(true);
    console.log('🔄 STARTING REORDER - Setting isReordering to true');
    
    // Optimistically update local state first
    const tempPropertyId = selectedPropertyData.raw.id;
    setCustomProperties(prev => {
      const updated = prev.map(prop => 
        prop.id === tempPropertyId ? { ...prop, options: reorderedRawOptions } : prop
      );
      console.log('🔄 OPTIMISTIC UPDATE:', updated);
      return updated;
    });
    
    try {
      console.log('BEFORE reorder - current state:', selectedPropertyData.raw.options);
      console.log('Reordering options - sending to backend:', reorderedRawOptions);
      
      const res = await fetch(`/api/custom-properties/${selectedPropertyData.raw.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: reorderedRawOptions
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to reorder options - Response:', errorText);
        
        // Revert optimistic update on error
        setCustomProperties(prev => 
          prev.map(prop => 
            prop.id === tempPropertyId ? selectedPropertyData.raw : prop
          )
        );
        throw new Error('Failed to reorder options');
      }
      
      const updatedProperty = await res.json();
      console.log('✅ BACKEND SUCCESS - updated property from backend:', updatedProperty);
      console.log('Updated property options:', updatedProperty.options);
      
      // Update with actual backend response
      setCustomProperties(prev => {
        const newProps = prev.map(prop => 
          prop.id === updatedProperty.id ? updatedProperty : prop
        );
        console.log('✅ FINAL STATE UPDATE:', newProps);
        return newProps;
      });
      
    } catch (err) {
      console.error('❌ REORDER FAILED:', err);
      throw err;
    } finally {
      // Add delay before allowing external updates again
      setTimeout(() => {
        setIsReordering(false);
        console.log('🔄 REORDER COMPLETE - Setting isReordering to false');
      }, 1000);
    }
  };

  // Loading state
  if (loadingProps) {
    return (
      <div className="custom-properties-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading properties...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (propsError) {
    return (
      <div className="custom-properties-container">
        <div className="error-state">
          <span>Error loading properties: {propsError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-properties-container">
      <div className="property-selector">
        <label className="selector-label">Select Property</label>
        <div className="dropdown-container">
          <button
            type="button"
            className={`dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
            onClick={handleDropdownToggle}
          >
            <div className="dropdown-content">
              {selectedPropertyData ? (
                <>
                  {selectedPropertyData.icon}
                  <span>{selectedPropertyData.label}</span>
                </>
              ) : (
                <span className="placeholder">Choose a property to manage</span>
              )}
            </div>
            <ChevronDown size={16} className={`dropdown-arrow ${dropdownOpen ? 'rotated' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              {propertyOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`dropdown-option ${selectedProperty === option.value ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedProperty(option.value);
                    setDropdownOpen(false);
                  }}
                >
                  {option.icon}
                  <span>{option.label}</span>
                  {option.multiSelect && (
                    <span className="option-badge">Multi</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                className="dropdown-option create-new-option"
                onClick={() => {
                  setDropdownOpen(false);
                  setShowCreateModal(true);
                }}
              >
                <Plus size={16} style={{ marginRight: 6 }} />
                <span>Create new property</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Show property editor for selected property if it supports options */}
      {selectedPropertyData && (selectedPropertyData.raw.fieldType === 'DROPDOWN' || selectedPropertyData.raw.fieldType === 'MULTISELECT') && (
        <PropertyEditor
          label={selectedPropertyData.label}
          options={getOptionLabels(selectedPropertyData.raw)}
          rawOptions={selectedPropertyData.raw.options || []}
          onAdd={handleAddOption}
          onRename={handleRenameOption}
          onDelete={handleDeleteOption}
          onReorder={handleReorderOptions}
          multiSelect={selectedPropertyData.raw.fieldType === 'MULTISELECT'}
          icon={selectedPropertyData.icon}
        />
      )}

      {/* Show message for non-option properties */}
      {selectedPropertyData && selectedPropertyData.raw.fieldType === 'TEXT' && (
        <div className="property-editor-container">
          <div className="property-editor">
            <div className="property-header">
              <div className="property-title">
                {selectedPropertyData.icon}
                <h3>{selectedPropertyData.label}</h3>
              </div>
            </div>
            <div className="empty-state">
              <span>Text properties don't have options to configure</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Property Modal */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateProperty} style={{ minWidth: 320 }}>
            <DialogTitle>Create New Property</DialogTitle>
            <DialogContent>
              <TextField
                label="Property Name"
                value={newPropName}
                onChange={e => {
                  setNewPropName(e.target.value);
                  setNewPropFieldKey(e.target.value.replace(/\s+/g, '_').toLowerCase());
                }}
                required
                autoFocus
                fullWidth
                margin="normal"
              />
              <TextField
                select
                label="Field Type"
                value={newPropType}
                onChange={e => setNewPropType(e.target.value)}
                fullWidth
                margin="normal"
              >
                <MenuItem value="TEXT">Text</MenuItem>
                <MenuItem value="DATE">Date Picker</MenuItem>
                <MenuItem value="DROPDOWN">Dropdown</MenuItem>
                <MenuItem value="MULTISELECT">Multi-select</MenuItem>
              </TextField>
              {createError && <div className="status-message error">{createError}</div>}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCreateModal(false)} color="secondary">Cancel</Button>
              <Button type="submit" variant="contained" disabled={creating || !newPropName.trim()}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Success message - temporarily disabled 
      {updateMutation.isSuccess && (
        <div className="status-message success">
          Property updated successfully!
        </div>
      )}
      */}
    </div>
  );
};

export default CustomProperties;