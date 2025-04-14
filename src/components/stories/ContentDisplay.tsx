
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import '@/styles/markdown.css';
import { sanitizeContentForReact } from '@/contexts/stories/api';

export type ContentType = 'lld' | 'code' | 'tests' | 'testcases';

interface ContentDisplayProps {
  content: string;
  contentType: ContentType;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, contentType }) => {
  if (!content) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No {contentType.toUpperCase()} content has been generated yet.</p>
      </div>
    );
  }

  // Sanitize content for React
  const sanitizedContent = sanitizeContentForReact(content);

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default ContentDisplay;
