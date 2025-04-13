
import React from "react";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CardyMindHeaderProps {
  isRefreshing: boolean;
  onForceProcess: () => void;
  hasSelectedDocuments: boolean;
}

const CardyMindHeader: React.FC<CardyMindHeaderProps> = ({
  isRefreshing,
  onForceProcess,
  hasSelectedDocuments
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-2 bg-purple-100 p-1 rounded">
          <BrainCircuit className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cardy Mind</h1>
          <p className="text-muted-foreground">
            Ask questions about your project documents using our RAG system
          </p>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onForceProcess} 
        disabled={isRefreshing || !hasSelectedDocuments}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Force Process Documents
      </Button>
    </div>
  );
};

export default CardyMindHeader;
