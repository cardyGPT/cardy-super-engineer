
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Database, FileText, Layers, Code, FileJson, BarChart, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const RagInfoCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Brain className="h-5 w-5 text-purple-500 mr-2" />
              RAG-Powered Document Assistant
            </CardTitle>
            <CollapsibleTrigger 
              className="hover:bg-slate-100 p-1 rounded-full transition-colors"
            >
              {isOpen ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2">
                <FileText className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p>Documents are processed with <span className="font-medium text-blue-600">semantic chunking</span> to preserve context integrity.</p>
              </div>
              <div className="flex items-start space-x-2">
                <FileJson className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>JSON data models are intelligently parsed to maintain entity relationships and structure.</p>
              </div>
              <div className="flex items-start space-x-2">
                <Database className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p>Each chunk is embedded with OpenAI's <span className="font-medium text-green-600">text-embedding-ada-002</span> model and stored in pgvector.</p>
              </div>
              <div className="flex items-start space-x-2">
                <Layers className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>Queries use <span className="font-medium text-amber-600">vector similarity search</span> with <span className="font-medium text-amber-600">project-specific context</span> filtering.</p>
              </div>
              <div className="flex items-start space-x-2">
                <Code className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <p>GPT-4o processes retrieved chunks with <span className="font-medium text-purple-600">document citations</span> for accurate, contextual responses.</p>
              </div>
              <div className="flex items-start space-x-2">
                <BarChart className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p>All document queries maintain <span className="font-medium text-indigo-600">source provenance</span> for traceability and verification.</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default RagInfoCard;
