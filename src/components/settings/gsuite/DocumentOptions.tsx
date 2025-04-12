
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";

interface DocumentOptionsProps {
  isLoading: boolean;
  initializing: boolean;
  handleSaveSettings: () => void;
}

const DocumentOptions: React.FC<DocumentOptionsProps> = ({
  isLoading,
  initializing,
  handleSaveSettings
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Components</CardTitle>
        <CardDescription>
          Customize which components to include in your documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Document Structure</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="include-title" defaultChecked />
                <Label htmlFor="include-title">Include document title</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="include-summary" defaultChecked />
                <Label htmlFor="include-summary">Include ticket summary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="include-desc" defaultChecked />
                <Label htmlFor="include-desc">Include ticket description</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="include-sections" defaultChecked />
                <Label htmlFor="include-sections">Include section headers</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Formatting Options</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="use-page-breaks" defaultChecked />
                <Label htmlFor="use-page-breaks">Use page breaks between sections</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="include-page-numbers" defaultChecked />
                <Label htmlFor="include-page-numbers">Include page numbers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="landscape-mode" />
                <Label htmlFor="landscape-mode">Use landscape orientation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="wide-tables" defaultChecked />
                <Label htmlFor="wide-tables">Use full-width tables</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={isLoading || initializing} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentOptions;
