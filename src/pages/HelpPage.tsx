
import React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Code, TestTube, FileCode, CheckSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const HelpPage = () => {
  const navigate = useNavigate();
  
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12 py-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">Cardy Super Engineer</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cardy Super Engineer generates LLDs, code, and test scripts — instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start">
                <FileText className="w-10 h-10 text-blue-600 mr-4" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Low-level design generation</h2>
                  <p className="text-gray-600 mb-4">
                    Generate comprehensive, context-aware low-level design documents that align perfectly with requirements.
                  </p>
                  <Button onClick={() => navigate("/generate")} className="w-full bg-blue-600 hover:bg-blue-700">
                    Generate LLD
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start">
                <Code className="w-10 h-10 text-green-600 mr-4" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Code snippets & unit tests</h2>
                  <p className="text-gray-600 mb-4">
                    Create production-ready code with accompanying unit tests that follow project standards.
                  </p>
                  <Button onClick={() => navigate("/generate")} className="w-full bg-green-600 hover:bg-green-700">
                    Generate Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start">
                <FileCode className="w-10 h-10 text-orange-600 mr-4" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Test cases & automation scripts</h2>
                  <p className="text-gray-600 mb-4">
                    Build comprehensive test plans and automation scripts based on requirements and specifications.
                  </p>
                  <Button onClick={() => navigate("/generate")} className="w-full bg-orange-600 hover:bg-orange-700">
                    Generate Tests
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start">
                <Settings className="w-10 h-10 text-purple-600 mr-4" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Integrated with your tools</h2>
                  <p className="text-gray-600 mb-4">
                    Seamlessly connect with Jira, G Suite, Bitbucket & Slack for streamlined workflows.
                  </p>
                  <Button onClick={() => navigate("/settings")} className="w-full bg-purple-600 hover:bg-purple-700">
                    Configure Integrations
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden mb-12">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">How Cardy Super Engineer Works</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-medium text-lg mb-2">1. Connect & Import</h3>
                <p className="text-gray-600">Connect to Jira and import your user stories, or create projects directly in the platform</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Code className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-medium text-lg mb-2">2. Generate & Refine</h3>
                <p className="text-gray-600">AI generates detailed designs, code implementations, and comprehensive test cases</p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FileCode className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-medium text-lg mb-2">3. Export & Implement</h3>
                <p className="text-gray-600">Export to Google Docs or download as files, then push directly to your Jira tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default HelpPage;
