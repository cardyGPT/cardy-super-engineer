
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ProjectDocument } from "@/types";

interface DocumentSelectionProps {
  documents: ProjectDocument[];
  selectedProject: string | null;
  selectedDocuments: string[];
  handleDocumentToggle: (docId: string, checked: boolean) => void;
  handleSelectAllDocuments: () => void;
  handleClearAllDocuments: () => void;
}

const DocumentSelection: React.FC<DocumentSelectionProps> = ({
  documents,
  selectedProject,
  selectedDocuments,
  handleDocumentToggle,
  handleSelectAllDocuments,
  handleClearAllDocuments
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Document Selection</h3>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              <span className="text-xs">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              <span className="text-xs">Index Docs</span>
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground mb-2">
          Using all indexed project documents
        </div>
        
        <div className="flex space-x-2 mb-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs"
            onClick={handleSelectAllDocuments}
          >
            Select All
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs"
            onClick={handleClearAllDocuments}
          >
            Clear
          </Button>
        </div>
        
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {documents
            .filter(doc => !selectedProject || doc.projectId === selectedProject)
            .filter(doc => doc.type !== "data-model")
            .map(doc => (
              <div key={doc.id} className="flex items-center space-x-2 p-2 border rounded text-sm">
                <Checkbox 
                  id={`doc-${doc.id}`}
                  checked={selectedDocuments.includes(doc.id)}
                  onCheckedChange={(checked) => 
                    handleDocumentToggle(doc.id, checked as boolean)
                  }
                  className="mr-2"
                />
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1">{doc.name}</span>
                <div className="flex items-center bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  <span>Indexed</span>
                </div>
              </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentSelection;
