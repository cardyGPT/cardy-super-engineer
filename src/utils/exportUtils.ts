
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a PDF from a given HTML element
 * @param element The HTML element to convert to PDF
 * @param fileName The name of the PDF file (without extension)
 */
export const downloadAsPDF = async (element: HTMLElement, fileName: string = 'document') => {
  if (!element) {
    console.error('No element provided for PDF download');
    return;
  }
  
  try {
    // Create a canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for images
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm (210mm)
    const pageHeight = 297; // A4 height in mm (297mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    let currentPage = 1;
    
    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/png'), 
      'PNG', 
      0, 
      position, 
      imgWidth, 
      imgHeight
    );
    heightLeft -= pageHeight;
    
    // Add more pages if content overflows
    while (heightLeft > 0) {
      position = -pageHeight * currentPage;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'), 
        'PNG', 
        0, 
        position, 
        imgWidth, 
        imgHeight
      );
      heightLeft -= pageHeight;
      currentPage++;
    }
    
    // Download the PDF
    pdf.save(`${fileName}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

/**
 * Downloads content as a simple text file
 * @param content Text content to download
 * @param fileName Name of the file (without extension)
 * @param extension File extension (default: 'txt')
 */
export const downloadAsTextFile = (
  content: string, 
  fileName: string = 'document',
  extension: string = 'txt'
) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = `${fileName}.${extension}`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Format a timestamp as a string suitable for filenames
 * @returns String like "2023-04-12_143045"
 */
export const formatTimestampForFilename = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `${date}_${time}`;
};
