
import { saveAs } from 'file-saver';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  ImageRun
} from 'docx';

/**
 * Export content to a Word document
 */
export const exportToWord = async (
  content: string, 
  fileName: string,
  logoUrl?: string
): Promise<void> => {
  try {
    // Create document sections
    const children = await formatMarkdownToWordContent(content, logoUrl);
    
    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children
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
  
  // Format markdown content
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let currentParagraphText = '';
  let codeBlockContent = '';
  
  for (const line of lines) {
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        if (codeBlockContent) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBlockContent,
                  font: 'Courier New',
                  size: 20
                })
              ],
              shading: {
                type: 'solid',
                color: 'F5F5F5',
                fill: 'F5F5F5'
              },
              spacing: { before: 200, after: 200 }
            })
          );
          codeBlockContent = '';
        }
        inCodeBlock = false;
      } else {
        // Start of code block
        if (currentParagraphText) {
          children.push(new Paragraph({ text: currentParagraphText }));
          currentParagraphText = '';
        }
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent += line + '\n';
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
    } else if (line.trim() === '') {
      // End of paragraph
      if (currentParagraphText) {
        children.push(new Paragraph({ text: currentParagraphText }));
        currentParagraphText = '';
      }
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
