
import React, { useState } from 'react';
import { useMarkdownComponents } from '@/utils/contentFormatters';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Edit, Save, X } from 'lucide-react';

interface ContentDisplayProps {
  content: string;
  type: 'lld' | 'code' | 'tests';
  title?: string;
  ticketKey?: string;
  isEditing?: boolean;
  onEdit?: (newContent: string) => void;
  generatedAt?: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ 
  content, 
  type, 
  title, 
  ticketKey,
  isEditing,
  onEdit,
  generatedAt
}) => {
  const markdownComponents = useMarkdownComponents();
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [copied, setCopied] = useState(false);

  if (!content) {
    return (
      <div className="p-4 border rounded-md text-center text-muted-foreground bg-muted">
        <p>No {type.toUpperCase()} content available</p>
        <p className="text-sm mt-2">Use the Generate button above to create content</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editContent);
    }
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setEditMode(false);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="relative">
      {generatedAt && (
        <div className="text-xs text-muted-foreground mb-2">
          Generated: {formatTimestamp(generatedAt)}
        </div>
      )}
      
      <div className="absolute top-2 right-2 z-10 flex gap-1.5">
        {isEditing && !editMode && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7 rounded-full"
            onClick={() => setEditMode(true)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 rounded-full"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {editMode ? (
        <div className="space-y-2">
          <Textarea 
            value={editContent} 
            onChange={(e) => setEditContent(e.target.value)} 
            className="h-[500px] font-mono text-sm" 
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-md relative p-4 overflow-auto bg-white dark:bg-gray-950 max-h-[650px] prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeHighlight, { ignoreMissing: true }]]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default ContentDisplay;
