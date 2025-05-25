
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This component is permanently disabled to prevent errors
const WordExportButton: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Feature Disabled",
      description: "Word export is permanently disabled. Please use PDF export instead.",
      variant: "default",
    });
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={true}
      className={className}
    >
      <FileText className="h-4 w-4 mr-1" />
      Word (Disabled)
    </Button>
  );
};

export default WordExportButton;
