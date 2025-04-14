
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Plus } from "lucide-react";

const DocumentsPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Documents & Data Model</h1>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Project Documents</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No documents uploaded yet</p>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default DocumentsPage;
