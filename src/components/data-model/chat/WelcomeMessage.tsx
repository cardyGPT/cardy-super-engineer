
import { BrainCircuit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const WelcomeMessage = () => {
  return (
    <div className="bg-muted/50 p-3 border-b">
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Cardy Mind</AlertTitle>
        <AlertDescription className="text-sm">
          Ask questions about your data model AND project documents. I'll analyze both to provide 
          comprehensive answers about your project. Use the filters to focus your questions on specific contexts.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WelcomeMessage;
