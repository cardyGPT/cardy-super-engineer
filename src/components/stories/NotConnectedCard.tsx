
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { AlertCircle, Settings } from 'lucide-react';

const NotConnectedCard: React.FC = () => {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center text-amber-500 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Not Connected</span>
        </div>
        <CardTitle className="text-xl">Connect to Jira</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          You need to connect your Jira account to access and manage your stories.
          Go to the Settings page to configure your Jira integration.
        </p>
        
        <div className="bg-muted/50 rounded-md p-4 text-sm space-y-2">
          <p className="font-medium">What you'll need:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Your Jira domain URL (e.g., https://your-domain.atlassian.net)</li>
            <li>Your Jira account email</li>
            <li>A Jira API token (can be generated from your Atlassian account)</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4 mr-2" />
            Go to Settings
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotConnectedCard;
