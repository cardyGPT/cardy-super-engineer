
import React from 'react';

// Simple test file for export functionality
const ExportTest: React.FC = () => {
  const testExport = async () => {
    try {
      console.log('Testing export functionality...');
      
      // Simple markdown export test
      const content = '# Test Content\n\nThis is a test document.';
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      console.log('Export test successful - blob URL created:', url);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export test failed:', error);
    }
  };

  return (
    <div className="p-4">
      <h2>Export Test Component</h2>
      <button onClick={testExport} className="px-4 py-2 bg-blue-500 text-white rounded">
        Test Export
      </button>
    </div>
  );
};

export default ExportTest;
