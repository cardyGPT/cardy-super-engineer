
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { ContentType } from '@/types/jira';

interface ContentDisplayProps {
  content: string | null | undefined;
  contentType: ContentType;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, contentType }) => {
  if (!content) {
    return (
      <div className="p-6 text-center text-gray-500 italic">
        {contentType === 'lld' ? 'No Low-Level Design content generated yet.' : 
         contentType === 'code' ? 'No implementation code generated yet.' : 
         contentType === 'tests' ? 'No unit test content generated yet.' :
         contentType === 'testcases' ? 'No test case content generated yet.' :
         'No test script content generated yet.'}
      </div>
    );
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ContentDisplay;
export type { ContentType };
