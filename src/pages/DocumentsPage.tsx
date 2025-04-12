
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { FileUp, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DocumentUpload from "@/components/documents/DocumentUpload";

const DocumentsPage = () => {
  const { projects, documents } = useProject();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const filteredDocuments = documents.filter((doc) => {
    const matchesProject = projectFilter === "all" || doc.projectId === projectFilter;
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    return matchesProject && matchesType;
  });
  
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : "Unknown Project";
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

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-gray-500">View and manage project documents</p>
          </div>
          
          {projects.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Select a project and document type to upload
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="project" className="text-sm font-medium block mb-1">
                      Select Project
                    </label>
                    <Select defaultValue={projects[0]?.id}>
                      <SelectTrigger id="project">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DocumentUpload projectId={projects[0]?.id || ""} />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-end gap-4 mb-6">
            <h2 className="text-xl font-semibold">All Documents</h2>
            <div className="flex gap-4">
              <div>
                <label htmlFor="project-filter" className="text-sm font-medium block mb-1">
                  Filter by Project
                </label>
                <Select
                  value={projectFilter}
                  onValueChange={setProjectFilter}
                >
                  <SelectTrigger id="project-filter" className="w-[180px]">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="type-filter" className="text-sm font-medium block mb-1">
                  Filter by Type
                </label>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger id="type-filter" className="w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="data-model">Data Model</SelectItem>
                    <SelectItem value="system-requirements">System Requirements</SelectItem>
                    <SelectItem value="coding-guidelines">Coding Guidelines</SelectItem>
                    <SelectItem value="technical-design">Technical Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileUp className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No documents found</h3>
              <p className="text-sm text-gray-500 mt-1">
                {projects.length === 0
                  ? "Create a project first before uploading documents"
                  : "Try changing your filters or upload a new document"}
              </p>
              {projects.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <FileUp className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                      <DialogDescription>
                        Select a project and document type to upload
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="project" className="text-sm font-medium block mb-1">
                          Select Project
                        </label>
                        <Select defaultValue={projects[0]?.id}>
                          <SelectTrigger id="project">
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DocumentUpload projectId={projects[0]?.id || ""} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : (
            <Table>
              <TableCaption>A list of all your project documents</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{getProjectName(doc.projectId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDocumentTypeLabel(doc.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DocumentsPage;
