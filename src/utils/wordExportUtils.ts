
/**
 * Utilities for exporting content to Word format
 */

// Function to format content for Word export
export const exportToWord = async (
  content: string,
  fileName: string,
  logoUrl?: string
): Promise<boolean> => {
  try {
    // Start building the Word document HTML
    let wordDocument = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${fileName}</title>
        <style>
          /* Word document styles */
          body { font-family: Arial, sans-serif; line-height: 1.5; }
          h1 { font-size: 24pt; text-align: center; }
          h2 { font-size: 18pt; margin-top: 20pt; }
          h3 { font-size: 14pt; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          .page-break { page-break-before: always; }
          .logo { text-align: center; margin-bottom: 20px; }
          .title-page { text-align: center; margin-top: 100px; }
          .header-content { text-align: center; margin-top: 50px; margin-bottom: 100px; }
          .footer { text-align: center; font-size: 10pt; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="title-page">
          ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo" width="200" /></div>` : ''}
          <div class="header-content">
            ${content}
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a Blob with the HTML content
    const blob = new Blob([wordDocument], { type: 'application/msword' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Word:', error);
    return false;
  }
};
