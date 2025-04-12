
import { ProjectDocument } from "@/types";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Database, ExternalLink, FileCode, File } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DocumentListProps {
  projectId: string;
}

const DocumentList = ({ projectId }: DocumentListProps) => {
  const { documents, deleteDocument } = useProject();
  
  const projectDocuments = documents.filter(
    (doc) => doc.projectId === projectId
  );
  
  const getDocumentIcon = (docType: string) => {
    switch (docType) {
      case "data-model":
        return <Database className="h-4 w-4" />;
      case "system-requirements":
        return <FileText className="h-4 w-4" />;
      case "coding-guidelines":
        return <FileCode className="h-4 w-4" />;
      case "technical-design":
        return <File className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  const getDocumentTypeLabel = (docType: string) => {
    switch (docType) {
      case "data-model":
        return "Data Model";
      case "system-requirements":
        return "System Requirements";
      case "coding-guidelines":
        return "Coding Guidelines";
      case "technical-design":
        return "Technical Design";
      default:
        return docType;
    }
  };
  
  if (projectDocuments.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload documents to get started.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>List of project documents</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projectDocuments.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {getDocumentIcon(doc.type)}
                <Badge variant="outline">{getDocumentTypeLabel(doc.type)}</Badge>
              </div>
            </TableCell>
            <TableCell>{doc.name}</TableCell>
            <TableCell>{format(new Date(doc.uploadedAt), "MMM d, yyyy")}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(doc.fileUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Document</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this document? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteDocument(doc.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DocumentList;
