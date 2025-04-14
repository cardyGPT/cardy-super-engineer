
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface JiraApiTypeSelectorProps {
  apiType: 'agile' | 'classic' | 'cloud';
  onChange: (type: 'agile' | 'classic' | 'cloud') => void;
}

const JiraApiTypeSelector: React.FC<JiraApiTypeSelectorProps> = ({ apiType, onChange }) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Jira API Type</Label>
          <RadioGroup 
            value={apiType} 
            onValueChange={(value) => onChange(value as 'agile' | 'classic' | 'cloud')} 
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="agile" id="agile" />
              <Label htmlFor="agile" className="cursor-pointer">Agile</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cloud" id="cloud" />
              <Label htmlFor="cloud" className="cursor-pointer">Cloud</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="classic" id="classic" />
              <Label htmlFor="classic" className="cursor-pointer">Classic (Server)</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};

export default JiraApiTypeSelector;
