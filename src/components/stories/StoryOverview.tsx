
import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText, Code, TestTube, RefreshCw } from "lucide-react";
import { JiraTicket, ProjectContextData } from "@/types/jira";

interface StoryOverviewProps {
  ticket: JiraTicket;
  loading: boolean;
  error: string | null;
  isLldGenerated: boolean;
  isCodeGenerated: boolean;
  isTestsGenerated: boolean;
  projectContextData: ProjectContextData | null;
  onGenerateLLD: () => Promise<void>;
  onGenerateCode: () => Promise<void>;
  onGenerateTests: () => Promise<void>;
  onGenerateAll: () => Promise<void>;
}

const StoryOverview: React.FC<StoryOverviewProps> = ({
  ticket,
  loading,
  error,
  isLldGenerated,
  isCodeGenerated,
  isTestsGenerated,
  projectContextData,
  onGenerateLLD,
  onGenerateCode,
  onGenerateTests,
  onGenerateAll,
}) => {
  return (
    <div className="space-y-4">
      {/* Description Section */}
      <div>
        <h3 className="text-md font-semibold mb-2">Description</h3>
        <div className="border rounded-md p-3 bg-muted/30 whitespace-pre-wrap text-sm">
          {ticket.description || 'No description provided'}
        </div>
      </div>
      
      {/* Acceptance Criteria Section (if available) */}
      {ticket.acceptance_criteria && (
        <div>
          <h3 className="text-md font-semibold mb-2">Acceptance Criteria</h3>
          <div className="border rounded-md p-3 bg-muted/30 whitespace-pre-wrap text-sm">
            {ticket.acceptance_criteria}
          </div>
        </div>
      )}
      
      {/* Project Context Section */}
      {projectContextData && (
        <div>
          <h3 className="text-md font-semibold mb-2">Project Context</h3>
          <div className="border rounded-md p-3 bg-muted/30 text-sm">
            <p><strong>Project:</strong> {projectContextData.project.name} ({projectContextData.project.type})</p>
            {projectContextData.documents.length > 0 && (
              <div className="mt-2">
                <p><strong>Reference Documents:</strong></p>
                <ul className="list-disc list-inside pl-2 mt-1">
                  {projectContextData.documents.map(doc => (
                    <li key={doc.id}>{doc.name} ({doc.type})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Generate Content Buttons */}
      <div>
        <h3 className="text-md font-semibold mb-2">Generate Content</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGenerateLLD}
            disabled={loading}
            className="flex items-center"
          >
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {!loading && <FileText className="h-4 w-4 mr-2" />}
            {isLldGenerated ? 'Regenerate LLD' : 'Generate LLD'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGenerateCode}
            disabled={loading}
            className="flex items-center"
          >
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {!loading && <Code className="h-4 w-4 mr-2" />}
            {isCodeGenerated ? 'Regenerate Code' : 'Generate Code'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGenerateTests}
            disabled={loading}
            className="flex items-center"
          >
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {!loading && <TestTube className="h-4 w-4 mr-2" />}
            {isTestsGenerated ? 'Regenerate Tests' : 'Generate Tests'}
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={onGenerateAll}
            disabled={loading}
            className="flex items-center"
          >
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {!loading && <RefreshCw className="h-4 w-4 mr-2" />}
            Generate All
          </Button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default StoryOverview;
