
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderClosed } from "lucide-react";
import { Link } from "react-router-dom";

const ProjectsPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button asChild>
            <Link to="/settings">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sample Project</CardTitle>
              <CardDescription>Angular / Node.js / PostgreSQL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm">
                <FolderClosed className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">8 modules</span>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/projects/sample">
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-dashed border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-muted-foreground">Create New Project</CardTitle>
              <CardDescription>Set up a new project context</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/settings">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectsPage;
