
import React, { useEffect } from 'react';
import { exportToWord } from '@/utils/wordExportUtils';

const ExportTest: React.FC = () => {
  useEffect(() => {
    const testExport = async () => {
      try {
        console.log('Testing Word export...');
        await exportToWord();
        console.log('Word export test successful');
      } catch (error) {
        console.error('Word export test failed:', error);
      }
    };
    
    // Uncomment to run the test
    // testExport();
  }, []);
  
  return null;
};

export default ExportTest;
