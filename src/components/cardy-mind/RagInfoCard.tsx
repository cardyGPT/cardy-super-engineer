
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const RagInfoCard: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-medium mb-1">RAG-Powered Document Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Cardy Mind uses AI with Retrieval Augmented Generation (RAG) to analyze your documents.
              Documents are chunked, embedded with pgvector, and retrieved based on semantic
              similarity for accurate answers.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RagInfoCard;
