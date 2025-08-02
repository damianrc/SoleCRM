import React, { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import './CSVImportModal.css';

const CSVImportModal = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Fields, 3: Preview
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Available CRM fields that can be mapped
  const crmFields = [
    { key: '', label: 'Skip this column' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'status', label: 'Status' }
  ];

  // Valid status values from your schema - memoized to prevent dependency changes
  const validStatuses = useMemo(() => [
    'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'
  ], []);

  const resetModal = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setFieldMapping({});
    setStep(1);
    setErrors([]);
    setIsLoading(false);
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const parseCSV = (file) => {
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          setErrors(results.errors.map(err => err.message));
          setIsLoading(false);
          return;
        }

        const data = results.data;
        const csvHeaders = results.meta.fields || [];
        
        setCsvData(data);
        setHeaders(csvHeaders);
        
        // Auto-map common fields
        const autoMapping = {};
        csvHeaders.forEach(header => {
          const lowerHeader = header.toLowerCase().trim();
          if (lowerHeader.includes('name')) autoMapping[header] = 'name';
          else if (lowerHeader.includes('email')) autoMapping[header] = 'email';
          else if (lowerHeader.includes('phone')) autoMapping[header] = 'phone';
          else if (lowerHeader.includes('address')) autoMapping[header] = 'address';
          else if (lowerHeader.includes('status')) autoMapping[header] = 'status';
          else autoMapping[header] = '';
        });
        
        setFieldMapping(autoMapping);
        setStep(2);
        setIsLoading(false);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setErrors([error.message]);
        setIsLoading(false);
      }
    });
  };

  const handleMappingChange = (csvHeader, crmField) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvHeader]: crmField
    }));
  };

  // Memoize the validation to prevent re-calculation on every render
  const validationResult = useMemo(() => {
    if (csvData.length === 0 || Object.keys(fieldMapping).length === 0) {
      return { isValid: false, data: [], errors: [] };
    }

    const validationErrors = [];
    const processedData = [];

    csvData.forEach((row, index) => {
      const processedRow = {
        originalRowIndex: index + 1
      };
      
      let hasRequiredFields = false;

      Object.entries(fieldMapping).forEach(([csvHeader, crmField]) => {
        if (crmField && crmField !== '') {
          const value = row[csvHeader];
          
          if (crmField === 'name') {
            if (!value || value.trim() === '') {
              validationErrors.push(`Row ${index + 1}: Name is required`);
              return;
            }
            processedRow[crmField] = value.trim();
            hasRequiredFields = true;
          } else if (crmField === 'email') {
            if (value && value.trim() !== '') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value.trim())) {
                validationErrors.push(`Row ${index + 1}: Invalid email format`);
                return;
              }
              processedRow[crmField] = value.trim();
            }
          } else if (crmField === 'status') {
            if (value && value.trim() !== '') {
              const statusValue = value.trim().toUpperCase();
              if (!validStatuses.includes(statusValue)) {
                validationErrors.push(`Row ${index + 1}: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
                return;
              }
              processedRow[crmField] = statusValue;
            } else {
              processedRow[crmField] = 'NEW'; // Default status
            }
          } else {
            if (value && value.trim() !== '') {
              processedRow[crmField] = value.trim();
            }
          }
        }
      });

      if (!hasRequiredFields) {
        validationErrors.push(`Row ${index + 1}: At least name must be provided`);
      } else {
        processedData.push(processedRow);
      }
    });

    return { 
      isValid: validationErrors.length === 0, 
      data: processedData, 
      errors: validationErrors 
    };
  }, [csvData, fieldMapping, validStatuses]);

  const handlePreview = () => {
    if (validationResult.isValid) {
      setErrors([]); // Clear any previous errors
      setStep(3);
    } else {
      setErrors(validationResult.errors);
    }
  };

  const handleImport = async () => {
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    setIsLoading(true);
    try {
      await onImport(validationResult.data);
      onClose();
      resetModal();
    } catch (error) {
      console.error('Import failed:', error);
      setErrors([error.message || 'Import failed. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUploadStep = () => (
    <div className="csv-step">
      <div className="csv-upload-area" onClick={() => fileInputRef.current?.click()}>
        <Upload size={48} />
        <h3>Upload CSV File</h3>
        <p>Click to select a CSV file or drag and drop</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
      
      {file && (
        <div className="csv-file-info">
          <FileText size={20} />
          <span>{file.name}</span>
          <span className="csv-file-size">({(file.size / 1024).toFixed(1)} KB)</span>
        </div>
      )}
    </div>
  );

  const renderMappingStep = () => (
    <div className="csv-step">
      <h3>Map CSV Fields to CRM Fields</h3>
      <p>Match your CSV columns to the appropriate CRM fields:</p>
      
      <div className="csv-mapping-table">
        <div className="csv-mapping-header">
          <span>CSV Column</span>
          <span>Sample Data</span>
          <span>CRM Field</span>
        </div>
        
        {headers.map(header => (
          <div key={header} className="csv-mapping-row">
            <span className="csv-column-name">{header}</span>
            <span className="csv-sample-data">
              {csvData[0]?.[header] || 'No data'}
            </span>
            <select
              value={fieldMapping[header] || ''}
              onChange={(e) => handleMappingChange(header, e.target.value)}
              className="csv-field-select"
            >
              {crmFields.map(field => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      
      <div className="csv-mapping-info">
        <p><strong>Note:</strong> Name is required for all contacts. Status will default to "NEW" if not provided.</p>
        <p><strong>Valid Status values:</strong> {validStatuses.join(', ')}</p>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const previewData = validationResult.data.slice(0, 5); // Show first 5 records
    
    return (
      <div className="csv-step">
        <h3>Preview Import Data</h3>
        <p>Review the data that will be imported ({validationResult.data.length} contacts):</p>
        
        <div className="csv-preview-table">
          <div className="csv-preview-header">
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Status</span>
          </div>
          
          {previewData.map((row, index) => (
            <div key={index} className="csv-preview-row">
              <span>{row.name || '-'}</span>
              <span>{row.email || '-'}</span>
              <span>{row.phone || '-'}</span>
              <span>{row.status || 'NEW'}</span>
            </div>
          ))}
          
          {validationResult.data.length > 5 && (
            <div className="csv-preview-more">
              ... and {validationResult.data.length - 5} more contacts
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="csv-modal-overlay">
      <div className="csv-modal">
        <div className="csv-modal-header">
          <h2>Import Contacts from CSV</h2>
          <button onClick={() => { onClose(); resetModal(); }} className="csv-close-button">
            <X size={24} />
          </button>
        </div>

        <div className="csv-progress">
          <div className={`csv-progress-step ${step >= 1 ? 'active' : ''}`}>1. Upload</div>
          <div className={`csv-progress-step ${step >= 2 ? 'active' : ''}`}>2. Map Fields</div>
          <div className={`csv-progress-step ${step >= 3 ? 'active' : ''}`}>3. Preview</div>
        </div>

        <div className="csv-modal-body">
          {errors.length > 0 && (
            <div className="csv-errors">
              <AlertCircle size={20} />
              <div>
                <h4>Validation Errors:</h4>
                <ul>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="csv-loading">
              <div className="csv-spinner"></div>
              <p>Processing CSV file...</p>
            </div>
          )}

          {!isLoading && (
            <>
              {step === 1 && renderUploadStep()}
              {step === 2 && renderMappingStep()}
              {step === 3 && renderPreviewStep()}
            </>
          )}
        </div>

        <div className="csv-modal-footer">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)} 
              className="csv-button csv-button-secondary"
              disabled={isLoading}
            >
              Back
            </button>
          )}
          
          {step === 1 && file && !isLoading && (
            <button onClick={() => setStep(2)} className="csv-button csv-button-primary">
              Next
            </button>
          )}
          
          {step === 2 && (
            <button onClick={handlePreview} className="csv-button csv-button-primary">
              Preview
            </button>
          )}
          
          {step === 3 && (
            <button 
              onClick={handleImport} 
              className="csv-button csv-button-success"
              disabled={isLoading || !validationResult.isValid}
            >
              <CheckCircle size={16} />
              Import Contacts
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;