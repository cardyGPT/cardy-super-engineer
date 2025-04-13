
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface StoryDetailEmptyProps {
  title?: string;
  description?: string;
  alertTitle?: string;
  alertDescription?: string;
  showSettingsLink?: boolean;
  error?: string;
}

const StoryDetailEmpty: React.FC<StoryDetailEmptyProps> = ({
  title = "Story Details",
  description = "Select a story to view details",
  alertTitle = "No story selected",
  alertDescription = "Please select a story from the list to view its details",
  showSettingsLink = false,
  error
}) => {
  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={error ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error ? "Error" : alertTitle}</AlertTitle>
          <AlertDescription>
            {error || alertDescription}
          </AlertDescription>
        </Alert>
        
        {showSettingsLink && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Configure Jira Settings
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoryDetailEmpty;
