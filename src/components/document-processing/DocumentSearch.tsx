
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentChunk } from "@/types";
import { useDocumentProcessing } from "@/hooks/useDocumentProcessing";
import { Loader2, Search } from "lucide-react";

interface DocumentSearchProps {
  projectId?: string;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ projectId }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ chunks: DocumentChunk[], answer?: string } | null>(null);
  const { queryDocuments, loading } = useDocumentProcessing();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const searchResults = await queryDocuments(query, projectId);
    setResults(searchResults);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents..."
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {results && (
        <div className="space-y-6">
          {results.answer && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Answer</h3>
                <div className="text-sm whitespace-pre-line">{results.answer}</div>
              </CardContent>
            </Card>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">Relevant Document Sections</h3>
            {results.chunks.length > 0 ? (
              results.chunks.map((chunk) => (
                <Card key={chunk.id} className="mb-3">
                  <CardContent className="pt-6">
                    <div className="text-sm">{chunk.chunkText}</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Relevance: {(chunk.similarity! * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground">No relevant documents found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSearch;
