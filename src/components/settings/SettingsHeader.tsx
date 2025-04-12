
import React from 'react';
import { Button } from "@/components/ui/button";
import { Factory } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SettingsHeaderProps {
  jiraConnected: boolean;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ jiraConnected }) => {
  const navigate = useNavigate();

  const navigateToStories = () => {
    navigate('/stories');
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      {jiraConnected && (
        <Button onClick={navigateToStories} variant="outline" className="flex items-center">
          <Factory className="h-4 w-4 mr-2" />
          Back to Jira Stories
        </Button>
      )}
    </div>
  );
};

export default SettingsHeader;
