
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotConnectedCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jira Connection Required</CardTitle>
        <CardDescription>
          Please connect to Jira to view your stories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/settings">Connect to Jira</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotConnectedCard;
