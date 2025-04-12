
import React, { useRef } from 'react';
import StoryDetail from './StoryDetail';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileDown, FileText, Code, TestTube } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { downloadAsPDF, formatTimestampForFilename } from '@/utils/exportUtils';
import { useStories } from '@/contexts/StoriesContext';
import { useToast } from '@/components/ui/use-toast';

const StoryDetailWrapper: React.FC = () => {
  const detailRef = useRef<HTMLDivElement>(null);
  const { selectedTicket } = useStories();
  const { toast } = useToast();

  const handleDownloadPDF = async (contentType: 'lld' | 'code' | 'tests') => {
    if (!detailRef.current || !selectedTicket) {
      toast({
        title: "Download Error",
        description: "No content available to download",
        variant: "destructive",
      });
      return;
    }

    // Show loading toast
    toast({
      title: "Preparing Download",
      description: "Creating PDF document...",
    });

    try {
      // Generate PDF and download
      const ticketKey = selectedTicket.key || 'document';
      const timestamp = formatTimestampForFilename();
      const contentLabel = contentType === 'lld' ? 'LLD' : 
                           contentType === 'code' ? 'Code' : 'Tests';
      
      const fileName = `${ticketKey}_${contentLabel}_${timestamp}`;
      
      const result = await downloadAsPDF(detailRef.current, fileName);
      
      if (result) {
        toast({
          title: "Download Complete",
          description: `${contentLabel} document has been downloaded successfully.`,
          variant: "success",
        });
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Download Failed",
        description: "There was a problem creating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      {/* Download buttons */}
      {selectedTicket && (
        <Card className="p-2 mb-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="text-sm font-medium">Download Options:</div>
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadPDF('lld')}
                    className="flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    LLD
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download Low Level Design as PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadPDF('code')}
                    className="flex items-center"
                  >
                    <Code className="h-4 w-4 mr-1" />
                    Code
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download Generated Code as PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadPDF('tests')}
                    className="flex items-center"
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Tests
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download Test Cases as PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleDownloadPDF('lld')}
                    className="flex items-center bg-blue-600 hover:bg-blue-700"
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    Download All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download everything as PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Card>
      )}
      
      {/* Original StoryDetail component wrapped in a div with ref */}
      <div ref={detailRef}>
        <StoryDetail />
      </div>
    </div>
  );
};

export default StoryDetailWrapper;
