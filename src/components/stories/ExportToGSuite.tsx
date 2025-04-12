import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, File, Upload, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ExportToGSuiteProps {
  storyId: string;
  artifactType: 'lld' | 'code' | 'test';
  content: string;
}

const ExportToGSuite = ({ storyId, artifactType, content }: ExportToGSuiteProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [docName, setDocName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const generateDefaultDocName = () => {
    const date = new Date().toISOString().split('T')[0];
    const type = artifactType === 'lld' ? 'Design' : 
                artifactType === 'code' ? 'Code' : 'Test Cases';
    
    return `Story-${storyId}-${type}-${date}`;
  };

  const handleExport = async () => {
    if (!docName) {
      setDocName(generateDefaultDocName());
      return;
    }
    
    setIsExporting(true);
    setIsSuccess(false);
    
    try {
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
        toast({
          title: 'Export successful',
          description: `Document "${docName}" has been created in Google Drive`,
          variant: 'success',
        });
      } else {
        throw new Error(data.message || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting to GSuite:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export to Google Drive',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
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
        <div className="space-y-2">
          <Label htmlFor="doc-name">Document Name</Label>
          <Input 
            id="doc-name" 
            value={docName} 
            onChange={e => setDocName(e.target.value)}
            placeholder={generateDefaultDocName()}
            className="w-full"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          variant="default" 
          onClick={handleExport}
          disabled={isExporting}
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
