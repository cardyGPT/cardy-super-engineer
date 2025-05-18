
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentMetadata } from "@/types";
import { useDocumentProcessing } from "@/hooks/useDocumentProcessing";
import { Loader2, FilePlus, Trash2, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface DocumentListProps {
  projectId?: string;
  onSelectDocument?: (document: DocumentMetadata) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  projectId,
  onSelectDocument,
}) => {
  const { fetchDocumentMetadata, deleteDocument, loading, error } = useDocumentProcessing();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadDocuments = async () => {
      const docs = await fetchDocumentMetadata(projectId);
      setDocuments(docs);
    };

    loadDocuments();
  }, [projectId, refreshKey]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDelete = async (id: string) => {
    const success = await deleteDocument(id);
    if (success) {
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted",
      });
      setRefreshKey(prev => prev + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            No documents found. Upload a document to get started.
          </p>
        </div>
      ) : (
        documents.map((doc) => (
          <Card 
            key={doc.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectDocument && onSelectDocument(doc)}
          >
            <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium truncate">
                {doc.title}
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Delete document
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground truncate">
                  {doc.filename}
                </p>
                <div className="flex justify-between items-center">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(doc.status)} text-white`}
                  >
                    {doc.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default DocumentList;
