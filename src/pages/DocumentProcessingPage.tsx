
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DocumentMetadata } from "@/types";
import DocumentList from "@/components/document-processing/DocumentList";
import DocumentUpload from "@/components/document-processing/DocumentUpload";
import DocumentSearch from "@/components/document-processing/DocumentSearch";
import { useProject } from "@/contexts/ProjectContext";

const DocumentProcessingPage: React.FC = () => {
  const { currentProject } = useProject();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Document Processing</h1>
            <p className="text-muted-foreground">
              Upload, process, and search through your documents
            </p>
          </div>
          {currentProject && (
            <DocumentUpload
              projectId={currentProject.id}
              onUploadComplete={handleUploadComplete}
            />
          )}
        </div>

        {!currentProject ? (
          <Card className="p-6">
            <p>Please select a project to manage documents.</p>
          </Card>
        ) : (
          <Tabs defaultValue="documents" className="mt-6">
            <TabsList>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
            </TabsList>
            <TabsContent value="documents" className="mt-4">
              <DocumentList
                key={refreshKey}
                projectId={currentProject.id}
                onSelectDocument={setSelectedDocument}
              />
            </TabsContent>
            <TabsContent value="search" className="mt-4">
              <DocumentSearch projectId={currentProject.id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default DocumentProcessingPage;
