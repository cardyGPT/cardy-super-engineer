
import React, { useRef } from 'react';
import StoryDetail from './StoryDetail';
import { Button } from "@/components/ui/button";
import { Factory } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StoryDetailWrapper: React.FC = () => {
  const detailRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const navigateToStories = () => {
    navigate('/stories');
  };

  return (
    <div>
      <div className="container mx-auto py-4">
        <div className="flex justify-end mb-4">
          <Button onClick={navigateToStories} variant="outline" className="flex items-center">
            <Factory className="h-4 w-4 mr-2" />
            Back to Jira Stories
          </Button>
        </div>
      </div>
      {/* Original StoryDetail component wrapped in a div with ref */}
      <div ref={detailRef}>
        <StoryDetail />
      </div>
    </div>
  );
};

export default StoryDetailWrapper;
