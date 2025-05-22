
// This file is disabled to prevent errors
// The original functionality caused "this.getData is not a function" errors

import { saveAs } from 'file-saver';

/**
 * Export content to a Word document - DISABLED
 * This function has been disabled due to compatibility issues
 */
export const exportToWord = async (
  content: string, 
  fileName: string,
  logoUrl?: string
): Promise<void> => {
  console.log('Word export functionality has been disabled');
  return Promise.resolve();
};

// All other functions are also disabled
const formatMarkdownToWordContent = async (
  markdown: string,
  logoUrl?: string
): Promise<any[]> => {
  console.log('Word export functionality has been disabled');
  return Promise.resolve([]);
};
