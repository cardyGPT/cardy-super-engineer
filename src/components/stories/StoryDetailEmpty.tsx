
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const StoryDetailEmpty: React.FC = () => {
  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle>Story Details</CardTitle>
        <CardDescription>Select a story to view details</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No story selected</AlertTitle>
          <AlertDescription>
            Please select a story from the list to view its details
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default StoryDetailEmpty;
