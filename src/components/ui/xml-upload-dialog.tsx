import React, { useState } from 'react';
import { parseArchimateXML } from '../../lib/archimate-parser';

const XMLUploadDialog: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('No file selected.');
      return;
    }

    if (file.type !== 'text/xml') {
      setError('Please upload a valid XML file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const xmlContent = reader.result as string;
        const parsedData = parseArchimateXML(xmlContent);
        console.log('Parsed Data:', parsedData);
        setSuccessMessage('File uploaded and parsed successfully!');
        setError(null);
      } catch (err) {
        console.error('Parsing error:', err);
        setError('Failed to parse the XML file. Please check the file content.');
      }
    };
    reader.onerror = () => {
      setError('Error reading the file.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="xml-upload-dialog">
      <h2>Upload Archimate XML File</h2>
      <input type="file" accept=".xml" onChange={handleFileUpload} />
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default XMLUploadDialog;