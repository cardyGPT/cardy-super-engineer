
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const formatTimestampForFilename = (): string => {
  const now = new Date();
  return now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];
};

export const downloadAsPDF = async (
  element: HTMLElement, 
  fileName: string = 'document'
): Promise<boolean> => {
  try {
    // Wait a moment for any rendering to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 1.5, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true
    });
    
    // Calculate dimensions
    const imgWidth = 208; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm'
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Save the PDF
    pdf.save(`${fileName}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
