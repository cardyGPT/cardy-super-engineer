
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FolderKanban, FileUp, Database, PenTool, Code, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const Index = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12 py-8">
          <h1 className="text-4xl font-bold text-cardy-blue mb-4">Cardy Super Engineer</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Accelerate your development lifecycle with AI-powered project planning,
            documentation, code generation, and testing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <FolderKanban className="w-10 h-10 text-cardy-blue mr-4" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Project & Document Management</h2>
                <p className="text-gray-600 mb-4">
                  Organize requirements, guidelines, and designs for efficient knowledge management.
                  Keep all your project assets centralized and easily accessible.
                </p>
                <Button onClick={() => navigate("/projects")} className="w-full">
                  Manage Projects
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <PenTool className="w-10 h-10 text-cardy-blue mr-4" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Jira Integration</h2>
                <p className="text-gray-600 mb-4">
                  Connect directly with your Jira workflows. Import user stories and epics,
                  generate detailed documentation, and push content back to Jira tickets.
                </p>
                <Button onClick={() => navigate("/stories")} className="w-full">
                  Access Stories
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <Code className="w-10 h-10 text-cardy-blue mr-4" />
              <div>
                <h2 className="text-xl font-semibold mb-3">AI-Powered Development</h2>
                <p className="text-gray-600 mb-4">
                  Generate comprehensive Low-Level Designs (LLDs), production-ready code, and test cases
                  from your user stories. Speed up development with context-aware AI assistance.
                </p>
                <Button onClick={() => navigate("/stories")} className="w-full">
                  Generate Content
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <Database className="w-10 h-10 text-cardy-blue mr-4" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Data Model Visualization</h2>
                <p className="text-gray-600 mb-4">
                  Visualize and explore complex data relationships with interactive ER diagrams.
                  Query your data models through natural language to understand complex schemas.
                </p>
                <Button onClick={() => navigate("/data-models")} className="w-full">
                  Explore Data Models
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-lg mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">How Cardy Super Engineer Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Sparkles className="w-8 h-8 text-cardy-blue" />
              </div>
              <h3 className="font-medium text-lg mb-2">1. Connect & Import</h3>
              <p className="text-gray-600">Connect to Jira and import your user stories, or create projects directly in the platform</p>
            </div>
            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Code className="w-8 h-8 text-cardy-blue" />
              </div>
              <h3 className="font-medium text-lg mb-2">2. Generate & Refine</h3>
              <p className="text-gray-600">AI generates detailed designs, code implementations, and comprehensive test cases</p>
            </div>
            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FileUp className="w-8 h-8 text-cardy-blue" />
              </div>
              <h3 className="font-medium text-lg mb-2">3. Export & Implement</h3>
              <p className="text-gray-600">Export to Google Docs or download as files, then push directly to your Jira tickets</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">Get Started in Minutes</h2>
          <ol className="list-decimal list-inside space-y-4 max-w-2xl mx-auto">
            <li className="text-gray-700">
              <span className="font-medium">Connect to Jira</span> - Configure your Jira credentials in Settings to import your stories.
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Set up your OpenAI API key</span> - Enable AI-powered content generation in the Settings page.
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Create or import projects</span> - Add your first project or import from Jira to begin organizing your work.
            </li>
          </ol>
          <div className="mt-6 text-center">
            <Button onClick={() => navigate("/settings")} size="lg">
              Configure Settings
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
