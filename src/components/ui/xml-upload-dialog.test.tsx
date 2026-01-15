import { render, screen, fireEvent } from '@testing-library/react';
import XMLUploadDialog from './xml-upload-dialog';

describe('XMLUploadDialog', () => {
  test('renders upload dialog', () => {
    render(<XMLUploadDialog />);
    expect(screen.getByText('Upload Archimate XML File')).toBeInTheDocument();
  });

  test('shows error for unsupported file type', () => {
    render(<XMLUploadDialog />);
    const fileInput = screen.getByLabelText(/upload/i);
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('Please upload a valid XML file.')).toBeInTheDocument();
  });

  test('parses valid XML file', async () => {
    render(<XMLUploadDialog />);
    const fileInput = screen.getByLabelText(/upload/i);
    const validXML = '<root><element identifier="1" xsi:type="type1"><name>Element 1</name></element></root>';
    const file = new File([validXML], 'test.xml', { type: 'text/xml' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText('File uploaded and parsed successfully!')).toBeInTheDocument();
  });

  test('shows error for invalid XML file', async () => {
    render(<XMLUploadDialog />);
    const fileInput = screen.getByLabelText(/upload/i);
    const invalidXML = '<root><element></root>';
    const file = new File([invalidXML], 'test.xml', { type: 'text/xml' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText('Failed to parse the XML file. Please check the file content.')).toBeInTheDocument();
  });
});