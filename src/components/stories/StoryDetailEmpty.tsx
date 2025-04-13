
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface StoryDetailEmptyProps {
  title?: string;
  description?: string;
  alertTitle?: string;
  alertDescription?: string;
}

const StoryDetailEmpty: React.FC<StoryDetailEmptyProps> = ({
  title = "Story Details",
  description = "Select a story to view details",
  alertTitle = "No story selected",
  alertDescription = "Please select a story from the list to view its details"
}) => {
  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{alertTitle}</AlertTitle>
          <AlertDescription>
            {alertDescription}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default StoryDetailEmpty;
