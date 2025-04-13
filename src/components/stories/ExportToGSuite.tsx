
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, File, Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ExportToGSuiteProps {
  storyId?: string;
  storyKey?: string;
  content: string;
  contentType: "lld" | "code" | "tests";
}

const ExportToGSuite = ({ storyId, storyKey, content, contentType }: ExportToGSuiteProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [docName, setDocName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateDefaultDocName = () => {
    const date = new Date().toISOString().split('T')[0];
    const type = contentType === 'lld' ? 'Design' : 
                contentType === 'code' ? 'Code' : 
                contentType === 'test' ? 'Test Cases' : 'Complete Doc';
    
    return `Story-${storyKey || storyId || 'unknown'}-${type}-${date}`;
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
          artifactType: contentType,
          storyId: storyId || storyKey
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
          variant: 'default',
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
        variant: "destructive",
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
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center">
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Export to Google Docs
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        {error && (
          <Alert variant="destructive" className="mb-4 py-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isSuccess && documentUrl && (
          <Alert variant="default" className="mb-4 py-2 border-green-500 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100 dark:border-green-700">
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
          <Label htmlFor="doc-name" className="text-xs">Document Name</Label>
          <Input 
            id="doc-name" 
            value={docName} 
            onChange={e => setDocName(e.target.value)}
            placeholder={generateDefaultDocName()}
            className="w-full text-sm h-8"
            disabled={isExporting}
          />
          <p className="text-xs text-gray-500">
            Enter a name for your Google Doc or use the default
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-1 pb-3">
        <Button 
          variant="default" 
          size="sm"
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
