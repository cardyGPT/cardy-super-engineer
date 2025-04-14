
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

interface ContentDisplayProps {
  content: string;
  contentType?: 'lld' | 'code' | 'tests';
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, contentType = 'lld' }) => {
  // Format JSON content (if it appears to be JSON)
  const formatContent = (text: string) => {
    try {
      // Check if the content is JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const json = JSON.parse(text);
        return '```json\n' + JSON.stringify(json, null, 2) + '\n```';
      }
    } catch (e) {
      // Not valid JSON, continue with original text
    }
    
    // Return the original content
    return text;
  };

  const formattedContent = formatContent(content);
  
  return (
    <div className="prose dark:prose-invert max-w-none overflow-auto">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
};

export default ContentDisplay;
