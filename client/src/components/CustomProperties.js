import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { ChevronDown, Plus, Edit, Trash2, Check, X, Tag } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import { useUpdateUserContactProperties } from '../hooks/useUserContactProperties';
import './CustomProperties.css';

const PropertyEditor = ({ label, options, onAdd, onRename, onDelete, multiSelect, icon }) => {
  const [newOption, setNewOption] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');

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

  return (
    <div className="property-editor-container">
      <div className="property-editor">
        <div className="property-header">
          <div className="property-title">
            {icon}
            <h3>{label}</h3>
          </div>
          {multiSelect && (
            <span className="multiselect-badge">
              Multi-select
            </span>
          )}
        </div>

        <div className="options-list">
          {options.length === 0 ? (
            <div className="empty-state">
              <span>No {label.toLowerCase()} options yet</span>
            </div>
          ) : (
            options.map((opt, idx) => (
              <div key={`${opt}-${idx}`} className="option-item">
                {editingIdx === idx ? (
                  <div className="option-edit">
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
            ))
          )}
        </div>

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
            disabled={!newOption.trim()}
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
  const updateMutation = useUpdateUserContactProperties();
  const [selectedProperty, setSelectedProperty] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPropType, setNewPropType] = useState('TEXT');
  const [newPropName, setNewPropName] = useState('');
  const [newPropFieldKey, setNewPropFieldKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch all custom properties for the user
  React.useEffect(() => {
    async function fetchProps() {
      setLoadingProps(true);
      setPropsError(null);
      try {
        const res = await fetch('/api/custom-properties', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch custom properties');
        const props = await res.json();
        setCustomProperties(props);
      } catch (err) {
        setPropsError(err.message);
      } finally {
        setLoadingProps(false);
      }
    }
    fetchProps();
  }, []);

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
    return property.options.map(opt => typeof opt === 'string' ? opt : opt.label || opt.value || opt);
  };

  // Handlers for property option management (for DROPDOWN/MULTISELECT properties)
  const handleAddOption = async (option) => {
    if (!selectedPropertyData) return;
    
    try {
      const currentOptions = selectedPropertyData.raw.options || [];
      // Create new option object to match your API structure
      const newOption = {
        label: option,
        value: option.toLowerCase().replace(/\s+/g, '_'),
        sortOrder: currentOptions.length
      };
      const updatedOptions = [...currentOptions, newOption];
      
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
      
      if (!res.ok) throw new Error('Failed to add option');
      
      const updatedProperty = await res.json();
      
      // Update local state
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
          // Update the option object while preserving structure
          return {
            ...opt,
            label: newValue,
            value: newValue.toLowerCase().replace(/\s+/g, '_')
          };
        }
        return opt;
      });
      
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
      
      if (!res.ok) throw new Error('Failed to rename option');
      
      const updatedProperty = await res.json();
      
      // Update local state
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
      const updatedOptions = currentOptions.filter((_, idx) => idx !== index);
      
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
      
      if (!res.ok) throw new Error('Failed to delete option');
      
      const updatedProperty = await res.json();
      
      // Update local state
      setCustomProperties(prev => 
        prev.map(prop => 
          prop.id === updatedProperty.id ? updatedProperty : prop
        )
      );
    } catch (err) {
      console.error('Failed to delete option:', err);
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
          onAdd={handleAddOption}
          onRename={handleRenameOption}
          onDelete={handleDeleteOption}
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

      {/* Success message */}
      {updateMutation.isSuccess && (
        <div className="status-message success">
          Property updated successfully!
        </div>
      )}
    </div>
  );
};

export default CustomProperties;