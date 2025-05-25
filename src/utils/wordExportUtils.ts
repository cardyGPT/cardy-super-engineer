
// Word export functionality has been completely disabled to prevent errors
// This file is kept for compatibility but all functions are no-ops

import { saveAs } from 'file-saver';

/**
 * Export content to a Word document - COMPLETELY DISABLED
 * This function has been disabled due to compatibility issues
 */
export const exportToWord = async (
  content: string, 
  fileName: string,
  logoUrl?: string
): Promise<void> => {
  console.log('Word export functionality is completely disabled');
  throw new Error('Word export is temporarily disabled. Please use PDF export instead.');
};

// All helper functions are also disabled
const formatMarkdownToWordContent = async (
  markdown: string,
  logoUrl?: string
): Promise<any[]> => {
  throw new Error('Word export is disabled');
};

// Prevent any accidental usage
export default {
  exportToWord: () => {
    throw new Error('Word export is disabled');
  }
};
