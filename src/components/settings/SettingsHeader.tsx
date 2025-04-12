
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Factory, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SettingsHeaderProps {
  jiraConnected: boolean;
  isSaving?: boolean;
  showSavedStatus?: boolean;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ 
  jiraConnected, 
  isSaving = false,
  showSavedStatus = false
}) => {
  const navigate = useNavigate();

  const navigateToStories = () => {
    navigate('/stories');
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Settings</h1>
        {showSavedStatus && (
          isSaving ? (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Save className="h-3 w-3 mr-1 animate-pulse" />
              Saving...
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Save className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )
        )}
      </div>
      
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
