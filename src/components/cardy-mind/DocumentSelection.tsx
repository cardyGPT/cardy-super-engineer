
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, FileText, Check, Filter, FileUp, Search, FileJson, FileCode, FilePieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProjectDocument } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

interface DocumentSelectionProps {
  documents: ProjectDocument[];
  selectedProject: string | null;
  selectedDocuments: string[];
  isProcessing: boolean;
  handleDocumentToggle: (docId: string, checked: boolean) => void;
  handleSelectAllDocuments: () => void;
  handleClearAllDocuments: () => void;
  handleRefreshDocuments: () => void;
}

const DocumentSelection: React.FC<DocumentSelectionProps> = ({
  documents,
  selectedProject,
  selectedDocuments,
  isProcessing,
  handleDocumentToggle,
  handleSelectAllDocuments,
  handleClearAllDocuments,
  handleRefreshDocuments
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter documents based on the selected project and search query
  const filteredDocuments = documents
    .filter(doc => !selectedProject || doc.projectId === selectedProject)
    .filter(doc => doc.type !== "data-model" || doc.type === "data-model") // Include both data models and other documents
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Get document type icon
  const getDocumentIcon = (type: string) => {
    switch(type) {
      case 'data-model':
        return <FileJson className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      case 'requirements':
        return <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />;
      case 'technical-design':
        return <FileCode className="h-4 w-4 text-purple-500 flex-shrink-0" />;
      case 'coding-guidelines':
        return <FileCode className="h-4 w-4 text-green-500 flex-shrink-0" />;
      case 'analytics':
        return <FilePieChart className="h-4 w-4 text-orange-500 flex-shrink-0" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
  };

  // Group documents by type for better organization
  const documentsByType = filteredDocuments.reduce((acc, doc) => {
    const type = doc.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, ProjectDocument[]>);

  const documentTypes = Object.keys(documentsByType);
  const totalDocuments = filteredDocuments.length;
  const selectedCount = selectedDocuments.length;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Document Selection
          </span>
          <Badge variant={selectedCount > 0 ? "default" : "outline"} className="ml-2">
            {selectedCount}/{totalDocuments}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="flex space-x-2 mb-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={handleSelectAllDocuments}
                  disabled={totalDocuments === 0}
                >
                  Select All
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select all available documents</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={handleClearAllDocuments}
                  disabled={selectedCount === 0}
                >
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear document selection</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs ml-auto"
                  onClick={handleRefreshDocuments}
                  disabled={isProcessing}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh document list</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        {totalDocuments === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-md">
            <FileUp className="h-6 w-6 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No documents available for the selected project
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-4">
              {documentTypes.map(type => (
                <div key={type} className="space-y-2">
                  <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1">
                    {type.replace(/-/g, ' ')}
                  </h4>
                  {documentsByType[type].map(doc => (
                    <div key={doc.id} className="flex items-center space-x-2 p-2 border rounded-md text-sm hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        id={`doc-${doc.id}`}
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={(checked) => 
                          handleDocumentToggle(doc.id, checked as boolean)
                        }
                      />
                      <label htmlFor={`doc-${doc.id}`} className="flex items-center gap-2 flex-1 cursor-pointer">
                        {getDocumentIcon(doc.type)}
                        <span className="truncate flex-1">{doc.name}</span>
                      </label>
                      <Badge variant="outline" className="flex items-center bg-green-100 text-green-800 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        <span>Indexed</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSelection;
