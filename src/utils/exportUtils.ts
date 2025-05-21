
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
      allowTaint: true,
      onclone: (clonedDoc) => {
        // Make sure all styles are applied to the clone
        const clonedElement = clonedDoc.querySelector('[ref="documentRef"]');
        if (clonedElement) {
          clonedElement.setAttribute('style', 'padding: 20px; background: white;');
        }
      }
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

// Convert markdown to formatted HTML for better PDF export
export const markdownToHTML = (markdown: string): string => {
  // This is a simple markdown to HTML converter
  // For production use, consider using a proper markdown parser library
  
  let html = markdown
    // Headers
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
    
    // Bold and Italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/<\/li>\n<li>/g, '</li><li>')
    .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    
    // Paragraphs
    .replace(/^([^<].*)\n$/gm, '<p>$1</p>');
    
  return html;
};

// Format content for Word export (rich text format)
export const formatForWordExport = (
  content: string,
  title: string,
  metadata: Record<string, string>
): string => {
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
        h1 { font-size: 24pt; }
        h2 { font-size: 18pt; }
        h3 { font-size: 14pt; }
        p { margin-top: 0.5em; margin-bottom: 0.5em; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
        code { font-family: Consolas, monospace; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <tbody>
  `;
  
  // Add metadata
  Object.entries(metadata).forEach(([key, value]) => {
    htmlContent += `
      <tr>
        <td><strong>${key}</strong></td>
        <td>${value}</td>
      </tr>
    `;
  });
  
  htmlContent += `
        </tbody>
      </table>
      
      <hr>
      
      ${markdownToHTML(content)}
    </body>
    </html>
  `;
  
  return htmlContent;
};
