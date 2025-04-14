
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Upload, Plus } from "lucide-react";

const DataModelPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Smart ER Diagram</h1>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Import Data Model
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Entity Relationship Diagram</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-md">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No data model available yet</p>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Data Model
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default DataModelPage;
