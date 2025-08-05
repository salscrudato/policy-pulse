# PDF Upload Component

A modern, feature-rich PDF upload component that extracts and displays text content from PDF files.

## Features

- **Drag & Drop Interface**: Intuitive drag-and-drop functionality with visual feedback
- **File Validation**: Validates file type and size (10MB limit)
- **Text Extraction**: Uses PDF.js to extract text from all pages
- **Text Processing**: Cleans and formats extracted text for better readability
- **Document Statistics**: Shows word count, character count, line count, and estimated reading time
- **Copy to Clipboard**: Easy text copying functionality
- **Error Handling**: Graceful error handling with user-friendly messages
- **Loading States**: Visual feedback during processing
- **Responsive Design**: Works on all screen sizes

## Usage

```jsx
import { PDFUpload } from './components'

function App() {
  return (
    <div>
      <PDFUpload />
    </div>
  )
}
```

## Technical Details

### Dependencies

- `pdfjs-dist`: For PDF text extraction
- `react`: For component functionality

### Utility Functions Used

- `cleanPDFText`: Removes excessive whitespace and formatting issues
- `formatTextForDisplay`: Improves text readability
- `extractPDFMetadata`: Calculates document statistics

### File Limitations

- **File Type**: Only PDF files are accepted
- **File Size**: Maximum 10MB
- **Browser Support**: Modern browsers with File API support

## Styling

The component uses Tailwind CSS for styling with:

- Gradient header design
- Hover and focus states
- Responsive grid layout for statistics
- Smooth transitions and animations

## Error Handling

The component handles various error scenarios:

- Invalid file types
- Files too large
- PDF parsing errors
- Network issues

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Performance

- Lazy loading of PDF.js worker
- Efficient text processing
- Memory management for large files
- Optimized rendering for long text content
