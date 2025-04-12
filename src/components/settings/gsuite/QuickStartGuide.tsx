
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QuickStartGuide: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start Guide</CardTitle>
        <CardDescription>
          Learn how to use the GSuite integration with your Jira tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Connect your Google account using the settings above</li>
          <li>Select a Jira ticket from the Stories page</li>
          <li>Generate LLD, code, or tests using the AI assistant</li>
          <li>Use the "Export to Google" button to save to Google Drive or "Download as PDF" to download locally</li>
          <li>Content can be generated for various platforms including Angular.js (frontend), Node.js (backend), and PostgreSQL</li>
        </ol>
      </CardContent>
    </Card>
  );
};

export default QuickStartGuide;
