
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

export const formatContentForDisplay = (content: string): string => {
  if (!content) return '';
  
  // Detect if the content is JSON and format it
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // If parsing fails, it's not valid JSON, continue with other formatting
    }
  }

  return content;
};

export const formatCodeBlocks = (content: string): string => {
  if (!content) return '';
  
  // Pre-process markdown to handle edge cases
  let processedContent = content;
  
  // Replace any triple-backtick code blocks with proper language annotations if missing
  processedContent = processedContent.replace(/```\s*\n([\s\S]*?)```/g, (match, code) => {
    // Try to detect language
    const firstLine = code.trim().split('\n')[0];
    let detectedLang = 'plaintext';
    
    if (firstLine.includes('function') || firstLine.includes('const') || 
        firstLine.includes('let') || firstLine.includes('var') || 
        firstLine.includes('class') || firstLine.includes('import') || 
        firstLine.includes('export')) {
      detectedLang = firstLine.includes('tsx') ? 'tsx' : 
                     firstLine.includes('jsx') ? 'jsx' : 'javascript';
    } else if (firstLine.includes('<html') || firstLine.includes('<!DOCTYPE') || 
              firstLine.includes('<div') || firstLine.includes('<p')) {
      detectedLang = 'html';
    } else if (firstLine.includes('SELECT') || firstLine.includes('INSERT') || 
              firstLine.includes('UPDATE') || firstLine.includes('DELETE')) {
      detectedLang = 'sql';
    } else if (firstLine.includes('public class') || firstLine.includes('private class') || 
              firstLine.includes('@Test')) {
      detectedLang = 'java';
    }
    
    return `\`\`\`${detectedLang}\n${code}\`\`\``;
  });
  
  // Find all code blocks and add syntax highlighting
  processedContent = processedContent.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
    const lang = language || 'plaintext';
    try {
      const highlighted = hljs.highlight(code, { language: lang }).value;
      return `<pre class="code-block"><code class="language-${lang}">${highlighted}</code></pre>`;
    } catch (e) {
      // If highlighting fails, return the original code block
      return `<pre class="code-block"><code class="language-${lang}">${code}</code></pre>`;
    }
  });
  
  // Handle inline code blocks
  processedContent = processedContent.replace(/`([^`]+)`/g, (match, code) => {
    return `<code class="inline-code">${code}</code>`;
  });
  
  // Replace markdown headings
  processedContent = processedContent.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  processedContent = processedContent.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  processedContent = processedContent.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  processedContent = processedContent.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  processedContent = processedContent.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
  
  // Replace markdown lists
  processedContent = processedContent.replace(/^\* (.*$)/gm, '<ul><li>$1</li></ul>');
  processedContent = processedContent.replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>');
  processedContent = processedContent.replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>');
  
  // Simplify multiple list elements
  processedContent = processedContent.replace(/<\/ul>\s*<ul>/g, '');
  processedContent = processedContent.replace(/<\/ol>\s*<ol>/g, '');
  
  // Replace markdown tables (basic support)
  processedContent = processedContent.replace(/^\|(.+)\|$/gm, '<table><tr><td>$1</td></tr></table>');
  processedContent = processedContent.replace(/^([^<].*)\|([^<].*)$/gm, '<tr><td>$1</td><td>$2</td></tr>');
  processedContent = processedContent.replace(/<\/table>\s*<table>/g, '');
  
  // Handle bold and italic text
  processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processedContent = processedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Handle links
  processedContent = processedContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  return processedContent;
};

export const downloadContent = (content: string, filename: string): void => {
  // Create a blob with the content
  const blob = new Blob([content], { type: 'text/plain' });
  
  // Create a link element
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  
  // Append to the document, click it, and remove it
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const downloadFormattedHTML = (content: string, filename: string): void => {
  // Format the content for HTML display
  const formattedContent = formatCodeBlocks(content);
  
  // Create an HTML document with styling
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    p { margin-top: 0; margin-bottom: 16px; }
    code { font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace; }
    pre { padding: 16px; overflow: auto; background-color: #f6f8fa; border-radius: 3px; }
    pre code { padding: 0; border: none; background-color: transparent; }
    .code-block { background-color: #f6f8fa; padding: 1em; border-radius: 5px; overflow-x: auto; }
    .inline-code { background-color: rgba(27,31,35,0.05); padding: 0.2em 0.4em; border-radius: 3px; font-size: 85%; }
    table { border-collapse: collapse; width: 100%; }
    table, th, td { border: 1px solid #dfe2e5; }
    th, td { padding: 6px 13px; }
    tr:nth-child(even) { background-color: #f6f8fa; }
    ul, ol { padding-left: 2em; }
    blockquote { padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; }
  </style>
</head>
<body>
  ${formattedContent}
</body>
</html>
  `;
  
  // Create a blob with the HTML content
  const blob = new Blob([htmlContent], { type: 'text/html' });
  
  // Create a link element
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  
  // Append to the document, click it, and remove it
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
