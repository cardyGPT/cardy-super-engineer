
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FolderKanban, FileUp, Database, Code, Sparkles, FileText, Settings } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const Index = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12 py-8">
          <h1 className="text-4xl font-bold text-cardy-blue mb-4">Cardy Super Engineer</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cardy Super Engineer generates LLDs, code, and test scripts — instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <FileText className="w-10 h-10 text-cardy-blue mr-4" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Low-level design generation</h2>
                <p className="text-gray-600 mb-4">
                  Generate comprehensive, context-aware low-level design documents that align perfectly with requirements.
                </p>
                <Button onClick={() => navigate("/projects")} className="w-full">
                  Generate LLD
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <Code className="w-10 h-10 text-cardy-blue mr-4" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Code snippets & unit tests</h2>
                <p className="text-gray-600 mb-4">
                  Create production-ready code with accompanying unit tests that follow project standards.
                </p>
                <Button onClick={() => navigate("/stories")} className="w-full">
                  Generate Code
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <FileUp className="w-10 h-10 text-cardy-blue mr-4" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Test cases & automation scripts</h2>
                <p className="text-gray-600 mb-4">
                  Build comprehensive test plans and automation scripts based on requirements and specifications.
                </p>
                <Button onClick={() => navigate("/stories")} className="w-full">
                  Generate Tests
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <Settings className="w-10 h-10 text-cardy-blue mr-4" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Integrated with your tools</h2>
                <p className="text-gray-600 mb-4">
                  Seamlessly connect with Jira, G Suite, Bitbucket & Slack for streamlined workflows.
                </p>
                <Button onClick={() => navigate("/settings")} className="w-full">
                  Configure Integrations
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
