
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import '@/styles/markdown.css';

// Define allowed content types
export type ContentType = 'lld' | 'code' | 'tests' | 'testcases' | 'testScripts';

interface ContentDisplayProps {
  content: string | null;
  contentType: ContentType;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, contentType }) => {
  if (!content) {
    return (
      <div className="text-gray-500 italic">
        No {contentType === 'lld' ? 'Low-Level Design' : 
           contentType === 'code' ? 'Code' :
           contentType === 'tests' ? 'Unit Tests' :
           contentType === 'testcases' ? 'Test Cases' :
           contentType === 'testScripts' ? 'Test Scripts' : 
           contentType} content available.
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert markdown-body">
      <ReactMarkdown 
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ContentDisplay;
