
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FolderKanban, FileUp, Database } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const Index = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-cardy-blue mb-4">Cardy Super Engineer</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive platform for developers, testers, and tech leads to manage projects,
            documentation, and data models efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <FolderKanban className="w-12 h-12 text-cardy-blue mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Project Management</h2>
            <p className="text-gray-600 mb-4">
              Create and manage projects with details, type categorization, and custom attributes.
            </p>
            <Button onClick={() => navigate("/projects")} className="w-full">
              Manage Projects
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <FileUp className="w-12 h-12 text-cardy-blue mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Document Management</h2>
            <p className="text-gray-600 mb-4">
              Upload and organize project documents including requirements, guidelines, and designs.
            </p>
            <Button onClick={() => navigate("/documents")} className="w-full">
              Upload Documents
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Database className="w-12 h-12 text-cardy-blue mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">ER Diagram Viewer</h2>
            <p className="text-gray-600 mb-4">
              Visualize and explore data models with an interactive entity-relationship diagram viewer.
            </p>
            <Button onClick={() => navigate("/data-models")} className="w-full">
              View Data Models
            </Button>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-center">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-2 max-w-2xl mx-auto">
            <li className="text-gray-700">
              <span className="font-medium">Create a new project</span> - Start by creating a project with a name, type, and details.
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Upload project documents</span> - Upload data models, requirements, and other documentation.
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Explore data models</span> - Use the ER Diagram Viewer to visualize and understand your data structures.
            </li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
