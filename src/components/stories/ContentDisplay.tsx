
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from '@/contexts/stories/api';

export type ContentType = 'lld' | 'code' | 'tests' | 'testcases';

interface ContentDisplayProps {
  content: string | null | undefined;
  contentType: ContentType;
  isLoading?: boolean;
}

// Function to add table of contents if it doesn't exist (for LLD)
const ensureTableOfContents = (content: string): string => {
  // Only process LLD content
  if (!content.trim().startsWith('# Low-Level Design') && 
      !content.trim().startsWith('# LLD') &&
      !content.trim().startsWith('#Low-Level Design') &&
      !content.trim().startsWith('#LLD')) {
    return content;
  }
  
  // Check if TOC already exists
  if (content.includes('## Table of Contents') || 
      content.includes('## Contents') || 
      content.includes('## TOC')) {
    return content;
  }
  
  // Extract headings for TOC
  const headingRegex = /^##\s+(.+)$/gm;
  const headings: {level: number, text: string}[] = [];
  let match;
  
  // Find all h2 headings
  const lines = content.split('\n');
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headings in code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    if (!inCodeBlock && line.trim().startsWith('## ')) {
      const headingText = line.trim().replace(/^##\s+/, '');
      const anchor = headingText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ level: 2, text: headingText });
    }
  }
  
  // Build TOC
  let toc = '## Table of Contents\n';
  headings.forEach((heading, index) => {
    const anchor = heading.text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    toc += `${index + 1}. [${heading.text}](#${anchor})\n`;
  });
  
  // Find insertion point (after first heading)
  const firstHeadingEnd = content.indexOf('\n', content.indexOf('#'));
  if (firstHeadingEnd === -1) {
    return content + '\n\n' + toc + '\n';
  }
  
  // Insert TOC after first heading
  return content.substring(0, firstHeadingEnd + 1) + 
         '\n' + toc + '\n' + 
         content.substring(firstHeadingEnd + 1);
};

const ContentDisplay: React.FC<ContentDisplayProps> = ({ 
  content, 
  contentType,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }
  
  if (!content) {
    return (
      <div className="text-center py-8 text-gray-500">
        No content available. Generate content first.
      </div>
    );
  }
  
  // Process content based on type
  let processedContent = content;
  
  // For LLD, ensure there's a table of contents
  if (contentType === 'lld') {
    processedContent = ensureTableOfContents(processedContent);
  }
  
  // If it's HTML content, sanitize it
  if (processedContent.includes('<html>') || 
      processedContent.includes('<body>') || 
      processedContent.includes('<div>')) {
    return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedContent) }} />;
  }
  
  return (
    <div className="markdown-content prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeHighlight, { ignoreMissing: true }]]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default ContentDisplay;
