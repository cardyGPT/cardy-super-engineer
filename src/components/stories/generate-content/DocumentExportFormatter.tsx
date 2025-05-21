
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ContentType } from '../ContentDisplay';
import { JiraTicket } from '@/types/jira';

interface DocumentExportFormatterProps {
  content: string;
  contentType: ContentType;
  ticket: JiraTicket;
  userName?: string; // Added userName as an optional prop
}

const DocumentExportFormatter: React.FC<DocumentExportFormatterProps> = ({
  content,
  contentType,
  ticket,
  userName = 'AI Assistant'
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  // Fix the type issue by explicitly defining the contentTypeLabel
  const getContentTypeLabel = (type: ContentType): string => {
    switch(type) {
      case 'lld': return 'Low-Level Design';
      case 'code': return 'Implementation Code';
      case 'tests': return 'Unit Tests';
      case 'testcases': return 'Test Cases';
      case 'testScripts': return 'Test Scripts';
      default: return type.toString().toUpperCase();
    }
  };
  
  const contentTypeLabel = getContentTypeLabel(contentType);
  
  return (
    <div className="pdf-document p-8 bg-white text-black">
      <div className="document-header mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <img 
              src="/cardinality-logo.png" 
              alt="Company Logo" 
              className="h-12" 
              style={{ height: '50px' }}
            />
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">Generated: {formatDate(new Date().toISOString())}</div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mt-4 mb-2">{contentTypeLabel} Document</h1>
        <h2 className="text-xl text-gray-600 mb-6">{ticket.key}: {ticket.summary}</h2>
        
        <div className="metadata grid grid-cols-2 gap-x-4 gap-y-2 border p-4 rounded-md bg-gray-50 mb-6">
          <div className="metadata-item">
            <span className="font-semibold">Ticket Key:</span> {ticket.key}
          </div>
          <div className="metadata-item">
            <span className="font-semibold">Status:</span> {ticket.status || 'N/A'}
          </div>
          <div className="metadata-item">
            <span className="font-semibold">Type:</span> {ticket.issuetype?.name || 'N/A'}
          </div>
          <div className="metadata-item">
            <span className="font-semibold">Assignee:</span> {ticket.assignee || 'Unassigned'}
          </div>
          <div className="metadata-item">
            <span className="font-semibold">Priority:</span> {ticket.priority || 'N/A'}
          </div>
          <div className="metadata-item">
            <span className="font-semibold">Story Points:</span> {ticket.story_points || 'N/A'}
          </div>
          <div className="metadata-item">
            <span className="font-semibold">Created:</span> {formatDate(ticket.created_at)}
          </div>
          <div className="metadata-item">
            <span className="font-semibold">Updated:</span> {formatDate(ticket.updated_at)}
          </div>
        </div>
      </div>
      
      <div className="document-body">
        <h2 className="text-2xl font-bold mb-4">{contentTypeLabel} Content</h2>
        
        <div className="content prose max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
      
      <div className="document-footer mt-8 pt-4 border-t text-sm text-gray-500">
        <p>Auto-generated {contentTypeLabel} document for ticket {ticket.key}</p>
        <p className="mt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        {userName && <p className="mt-1">Created by: {userName}</p>}
      </div>
    </div>
  );
};

export default DocumentExportFormatter;
