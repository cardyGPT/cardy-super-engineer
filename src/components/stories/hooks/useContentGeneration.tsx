
import { useState } from 'react';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';
import { useToast } from '@/hooks/use-toast';
import { pushContentToJira, pushContentToGDrive, pushContentToBitbucket, generatePDF } from '@/contexts/stories/api/contentApi';

export const useContentGenerationActions = (ticket: JiraTicket | null) => {
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({});
  const [isPushing, setIsPushing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleCopyContent = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setIsCopied(prev => ({ ...prev, [type]: true }));
    
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    });
    
    setTimeout(() => {
      setIsCopied(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };
  
  const handlePushToJira = async (content: string, type: string) => {
    if (!ticket?.key) {
      toast({
        title: 'Error',
        description: 'Missing ticket key',
        variant: 'destructive'
      });
      return;
    }
    
    const pushType = `jira-${type}`;
    setIsPushing(prev => ({ ...prev, [pushType]: true }));
    
    try {
      await pushContentToJira({
        domain: '',
        email: '',
        apiToken: ''
      }, ticket.key, content);

      toast({
        title: 'Success',
        description: `Content pushed to Jira ticket ${ticket.key}`,
      });
    } catch (err: any) {
      console.error('Error pushing to Jira:', err);
      toast({
        title: 'Push Failed',
        description: err.message || 'Failed to push content to Jira',
        variant: 'destructive'
      });
    } finally {
      setIsPushing(prev => ({ ...prev, [pushType]: false }));
    }
  };
  
  const handlePushToGDrive = async (content: string, type: string) => {
    if (!ticket?.key) {
      toast({
        title: 'Error',
        description: 'Missing ticket key',
        variant: 'destructive'
      });
      return;
    }
    
    const pushType = `gdrive-${type}`;
    setIsPushing(prev => ({ ...prev, [pushType]: true }));
    
    try {
      await pushContentToGDrive(ticket.key, content, type);
      toast({
        title: 'Success',
        description: `Content pushed to Google Drive`,
      });
    } catch (err: any) {
      console.error('Error pushing to Google Drive:', err);
      toast({
        title: 'Push Failed',
        description: err.message || 'Failed to push content to Google Drive',
        variant: 'destructive'
      });
    } finally {
      setIsPushing(prev => ({ ...prev, [pushType]: false }));
    }
  };
  
  const handlePushToBitbucket = async (content: string, type: string) => {
    if (!ticket?.key) {
      toast({
        title: 'Error',
        description: 'Missing ticket key',
        variant: 'destructive'
      });
      return;
    }
    
    const pushType = `bitbucket-${type}`;
    setIsPushing(prev => ({ ...prev, [pushType]: true }));
    
    try {
      await pushContentToBitbucket(ticket.key, content, type);
      toast({
        title: 'Success',
        description: `Content pushed to Bitbucket`,
      });
    } catch (err: any) {
      console.error('Error pushing to Bitbucket:', err);
      toast({
        title: 'Push Failed',
        description: err.message || 'Failed to push content to Bitbucket',
        variant: 'destructive'
      });
    } finally {
      setIsPushing(prev => ({ ...prev, [pushType]: false }));
    }
  };
  
  const handleDownloadPDF = async (content: string, type: string) => {
    if (!ticket?.key) {
      toast({
        title: 'Error',
        description: 'Missing ticket key',
        variant: 'destructive'
      });
      return;
    }
    
    const pushType = `pdf-${type}`;
    setIsPushing(prev => ({ ...prev, [pushType]: true }));
    
    try {
      const pdfUrl = await generatePDF(ticket.key, content, type);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${ticket.key}-${type}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: `PDF downloaded`,
      });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      toast({
        title: 'PDF Generation Failed',
        description: err.message || 'Failed to generate PDF',
        variant: 'destructive'
      });
    } finally {
      setIsPushing(prev => ({ ...prev, [pushType]: false }));
    }
  };

  return {
    isCopied,
    isPushing,
    handleCopyContent,
    handlePushToJira,
    handlePushToGDrive,
    handlePushToBitbucket,
    handleDownloadPDF
  };
};
