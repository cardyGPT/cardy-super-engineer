
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, ImageRun } from 'docx';

export const exportToWord = async (
  content: string, 
  fileName: string,
  logoUrl?: string
): Promise<void> => {
  try {
    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: await formatMarkdownToWordContent(content, logoUrl)
        }
      ]
    });

    // Generate and save document
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, `${fileName}.docx`);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error exporting to Word:', error);
    return Promise.reject(error);
  }
};

// Convert markdown to Word document format
const formatMarkdownToWordContent = async (
  markdown: string,
  logoUrl?: string
): Promise<Paragraph[]> => {
  const children: Paragraph[] = [];
  
  // Add logo if provided
  if (logoUrl) {
    try {
      const response = await fetch(logoUrl);
      if (response.ok) {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: new Uint8Array(arrayBuffer),
                transformation: {
                  width: 100,
                  height: 50
                },
                type: 'png',
                altText: {
                  title: "Company Logo",
                  description: "Company Logo Image",
                  name: "Logo"
                }
              })
            ]
          })
        );
      }
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }
  
  // Add title
  children.push(
    new Paragraph({
      text: "Generated Document",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    })
  );
  
  // Format markdown content - basic implementation
  const lines = markdown.split('\n');
  let currentParagraphText = '';
  
  for (const line of lines) {
    if (line.trim() === '') {
      // End of paragraph
      if (currentParagraphText) {
        children.push(new Paragraph({ text: currentParagraphText }));
        currentParagraphText = '';
      }
      continue;
    }
    
    // Handle headings
    if (line.startsWith('# ')) {
      if (currentParagraphText) {
        children.push(new Paragraph({ text: currentParagraphText }));
        currentParagraphText = '';
      }
      children.push(new Paragraph({ 
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1
      }));
    } else if (line.startsWith('## ')) {
      if (currentParagraphText) {
        children.push(new Paragraph({ text: currentParagraphText }));
        currentParagraphText = '';
      }
      children.push(new Paragraph({ 
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2
      }));
    } else if (line.startsWith('### ')) {
      if (currentParagraphText) {
        children.push(new Paragraph({ text: currentParagraphText }));
        currentParagraphText = '';
      }
      children.push(new Paragraph({ 
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3
      }));
    } else {
      // Regular text
      currentParagraphText += (currentParagraphText ? ' ' : '') + line;
    }
  }
  
  // Add any remaining paragraph text
  if (currentParagraphText) {
    children.push(new Paragraph({ text: currentParagraphText }));
  }
  
  return children;
};
