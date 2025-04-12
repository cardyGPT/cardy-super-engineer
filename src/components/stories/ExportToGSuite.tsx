
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, File, Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExportToGSuiteProps {
  storyId: string;
  artifactType: 'lld' | 'code' | 'test';
  content: string;
}

const ExportToGSuite = ({ storyId, artifactType, content }: ExportToGSuiteProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [docName, setDocName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateDefaultDocName = () => {
    const date = new Date().toISOString().split('T')[0];
    const type = artifactType === 'lld' ? 'Design' : 
                artifactType === 'code' ? 'Code' : 'Test Cases';
    
    return `Story-${storyId}-${type}-${date}`;
  };

  const handleExport = async () => {
    if (!content || content.trim() === '') {
      toast({
        title: 'No content to export',
        description: 'There is no content to export to Google Docs',
        variant: 'destructive',
      });
      return;
    }
    
    if (!docName) {
      setDocName(generateDefaultDocName());
      return;
    }
    
    setIsExporting(true);
    setIsSuccess(false);
    setError(null);
    setDocumentUrl(null);
    
    try {
      toast({
        title: 'Exporting to Google Docs',
        description: 'Your document is being created...',
      });
      
      const { data, error } = await supabase.functions.invoke('export-to-gsuite', {
        body: {
          documentName: docName,
          content: content,
          artifactType: artifactType,
          storyId: storyId
        }
      });
      
      if (error) throw error;
      
      console.log('Export response:', data);
      
      if (data.success) {
        setIsSuccess(true);
        setDocumentUrl(data.documentUrl);
        toast({
          title: 'Export successful',
          description: `Document "${docName}" has been created in Google Drive`,
          variant: 'default', // Changed from 'success' to 'default'
        });
      } else {
        throw new Error(data.message || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting to GSuite:', error);
      let errorMessage = 'Failed to export to Google Drive';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Export failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const openDocument = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Export to Google Docs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isSuccess && documentUrl && (
          <Alert className="mb-4">
            <Check className="h-4 w-4 mr-2" />
            <AlertDescription>
              Document created successfully!{' '}
              <button 
                onClick={openDocument}
                className="underline font-medium hover:text-blue-700"
              >
                Open in Google Docs
              </button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="doc-name">Document Name</Label>
          <Input 
            id="doc-name" 
            value={docName} 
            onChange={e => setDocName(e.target.value)}
            placeholder={generateDefaultDocName()}
            className="w-full"
            disabled={isExporting}
          />
          <p className="text-xs text-gray-500">
            Enter a name for your Google Doc or leave blank to use the default name
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          variant="default" 
          onClick={handleExport}
          disabled={isExporting || !content || content.trim() === ''}
          className="flex items-center"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : isSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Exported
            </>
          ) : (
            <>
              <File className="h-4 w-4 mr-2" />
              Export to Docs
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExportToGSuite;
