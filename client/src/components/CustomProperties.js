import React, { useState } from 'react';
import { ChevronDown, Plus, Edit, Trash2, Check, X, Tag, Users, Activity } from 'lucide-react';
import { useUserContactProperties, useUpdateUserContactProperties } from '../hooks/useUserContactProperties';
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
  );
};

const CustomProperties = () => {
  const { data, isLoading, error } = useUserContactProperties();
  const updateMutation = useUpdateUserContactProperties();
  const [local, setLocal] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);


  React.useEffect(() => {
    console.log('useEffect - data changed:', data);
    if (data) {
      console.log('Setting local data:', data);
      setLocal(data);
    }
  }, [data]);

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

  if (isLoading) {
    console.log('CustomProperties: Loading state');
    return (
      <div className="custom-properties-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading properties...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('CustomProperties: Error state', error);
    return (
      <div className="custom-properties-container">
        <div className="error-state">
          <span>Error loading properties: {error.message}</span>
        </div>
      </div>
    );
  }

  // Provide fallback data if no data is loaded yet
  const workingData = local || {
    typeOptions: ['Lead', 'Prospect', 'Customer', 'Partner'],
    sourceOptions: ['Website', 'Referral', 'Social Media', 'Cold Outreach', 'Advertisement'],
    statusOptions: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost']
  };

  console.log('Working with data:', workingData);

  const handleChange = (field, updater) => {
    console.log('handleChange called with field:', field);
    try {
      const currentData = local || workingData;
      const updated = { ...currentData, [field]: updater(currentData[field]) };
      console.log('updated data:', updated);
      
      setLocal(updated);
      
      // Re-enable auto-save
      updateMutation.mutate(updated);
    } catch (error) {
      console.error('Error in handleChange:', error);
    }
  };

  const propertyOptions = [
    {
      value: 'type',
      label: 'Type',
      icon: <Tag size={16} />,
      field: 'typeOptions',
      multiSelect: true
    },
    {
      value: 'source',
      label: 'Source',
      icon: <Users size={16} />,
      field: 'sourceOptions',
      multiSelect: false
    },
    {
      value: 'status',
      label: 'Status',
      icon: <Activity size={16} />,
      field: 'statusOptions',
      multiSelect: false
    }
  ];

  const selectedPropertyData = propertyOptions.find(p => p.value === selectedProperty);

  // Debug logging
  console.log('CustomProperties render:', {
    selectedProperty,
    dropdownOpen,
    selectedPropertyData,
    local,
    data,
    isLoading,
    error
  });

  const handleDropdownToggle = () => {
    console.log('handleDropdownToggle called, current dropdownOpen:', dropdownOpen);
    setDropdownOpen(prev => {
      console.log('Setting dropdownOpen from', prev, 'to', !prev);
      return !prev;
    });
  };

  try {
    return (
      <div className="custom-properties-container">
      <div className="custom-properties-header">
        <h2>Contact Properties</h2>
        <p>Manage custom options for your contact properties. These will be available throughout your CRM.</p>
        

      </div>

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
                    console.log('Option clicked:', option.value);
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
            </div>
          )}
        </div>
      </div>

      {selectedPropertyData && (
        <div className="property-editor-container">
          <PropertyEditor
            label={selectedPropertyData.label}
            options={workingData[selectedPropertyData.field]}
            onAdd={opt => handleChange(selectedPropertyData.field, arr => [...arr, opt])}
            onRename={(idx, val) => handleChange(selectedPropertyData.field, arr => arr.map((o, i) => i === idx ? val : o))}
            onDelete={idx => handleChange(selectedPropertyData.field, arr => arr.filter((_, i) => i !== idx))}
            multiSelect={selectedPropertyData.multiSelect}
            icon={selectedPropertyData.icon}
          />
        </div>
      )}

      {updateMutation.isSuccess && (
        <div className="status-message success">
          <Check size={16} />
          Changes saved successfully!
        </div>
      )}

      {updateMutation.isError && (
        <div className="status-message error">
          <X size={16} />
          Error saving changes. Please try again.
        </div>
      )}
      </div>
    );
  } catch (error) {
    console.error('CustomProperties render error:', error);
    return (
      <div className="custom-properties-container">
        <div className="error-state">
          <h3>Component Error</h3>
          <p>Error: {error.message}</p>
          <pre>{error.stack}</pre>
        </div>
      </div>
    );
  }
};

export default CustomProperties;
