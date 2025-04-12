
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileCheck, FileDown, Save } from "lucide-react";

interface ExportSettingsProps {
  exportFormat: string;
  setExportFormat: (value: string) => void;
  includeMetadata: boolean;
  setIncludeMetadata: (value: boolean) => void;
  formatCode: boolean;
  setFormatCode: (value: boolean) => void;
  autoToc: boolean;
  setAutoToc: (value: boolean) => void;
  exportOptions: {
    angular: boolean;
    nodejs: boolean;
    postgres: boolean;
  };
  setExportOptions: (value: { angular: boolean; nodejs: boolean; postgres: boolean; }) => void;
  isLoading: boolean;
  initializing: boolean;
  handleSaveSettings: () => void;
}

const ExportSettings: React.FC<ExportSettingsProps> = ({
  exportFormat,
  setExportFormat,
  includeMetadata,
  setIncludeMetadata,
  formatCode,
  setFormatCode,
  autoToc,
  setAutoToc,
  exportOptions,
  setExportOptions,
  isLoading,
  initializing,
  handleSaveSettings
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Export & Download Options
        </CardTitle>
        <CardDescription>
          Configure how content is exported to Google Workspace or downloaded as files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Default Export Format</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant={exportFormat === "docs" ? "default" : "outline"} 
              className="justify-start"
              onClick={() => setExportFormat("docs")}
            >
              <svg 
                className="h-4 w-4 mr-2 text-blue-600" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path d="M14.727 6.727H21V21H3V3h11.727v3.727zm0 0H19.5L14.727 2v4.727z"/>
              </svg>
              Google Docs
            </Button>
            <Button 
              variant={exportFormat === "pdf" ? "default" : "outline"} 
              className="justify-start"
              onClick={() => setExportFormat("pdf")}
            >
              <FileDown className="h-4 w-4 mr-2 text-blue-600" />
              PDF Download
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Download or export your LLDs, code, and test cases in your preferred format
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Content Options</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="include-meta" 
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
              <Label htmlFor="include-meta">Include metadata (ticket ID, timestamps)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="format-code" 
                checked={formatCode}
                onCheckedChange={setFormatCode}
              />
              <Label htmlFor="format-code">Format code blocks with syntax highlighting</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="auto-toc" 
                checked={autoToc}
                onCheckedChange={setAutoToc}
              />
              <Label htmlFor="auto-toc">Add table of contents automatically</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>File Generation Options</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="angular-frontend" 
                checked={exportOptions.angular}
                onCheckedChange={(checked) => setExportOptions({...exportOptions, angular: checked})}
              />
              <Label htmlFor="angular-frontend">Include Angular.js frontend code</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="nodejs-backend" 
                checked={exportOptions.nodejs}
                onCheckedChange={(checked) => setExportOptions({...exportOptions, nodejs: checked})}
              />
              <Label htmlFor="nodejs-backend">Include Node.js backend code</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="postgres-sql" 
                checked={exportOptions.postgres}
                onCheckedChange={(checked) => setExportOptions({...exportOptions, postgres: checked})}
              />
              <Label htmlFor="postgres-sql">Include PostgreSQL (SPs, Triggers, Functions)</Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleSaveSettings} disabled={isLoading || initializing}>
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExportSettings;
