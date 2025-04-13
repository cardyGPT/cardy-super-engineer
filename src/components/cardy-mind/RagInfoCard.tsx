
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Database, FileText, Layers, Code, FileJson } from "lucide-react";

const RagInfoCard: React.FC = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Brain className="h-5 w-5 text-purple-500 mr-2" />
          RAG-Powered Document Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>Documents are processed with semantic chunking to preserve context integrity.</p>
          </div>
          <div className="flex items-start space-x-2">
            <FileJson className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p>JSON data models are intelligently parsed to maintain entity relationships and structure.</p>
          </div>
          <div className="flex items-start space-x-2">
            <Database className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p>Each chunk is embedded with OpenAI's text-embedding-ada-002 model and stored in pgvector.</p>
          </div>
          <div className="flex items-start space-x-2">
            <Layers className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p>Queries use vector similarity search to find the most relevant document sections.</p>
          </div>
          <div className="flex items-start space-x-2">
            <Code className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p>GPT-4o processes retrieved chunks with document citations for accurate, contextual responses.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RagInfoCard;
