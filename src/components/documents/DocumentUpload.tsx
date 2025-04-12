
import { useState } from "react";
import { DocumentType } from "@/types";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DocumentUploadProps {
  projectId: string;
  onUploadComplete?: () => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "data-model", label: "Data Model (JSON)" },
  { value: "system-requirements", label: "System Requirements (PDF/Word)" },
  { value: "coding-guidelines", label: "Coding Guidelines (PDF/Word)" },
  { value: "technical-design", label: "Technical Design (PDF/Word)" },
];

const DocumentUpload = ({ projectId, onUploadComplete }: DocumentUploadProps) => {
  const { uploadDocument } = useProject();
  const [docType, setDocType] = useState<DocumentType>("system-requirements");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Validate file type for data models
      if (docType === "data-model" && !selectedFile.name.toLowerCase().endsWith('.json')) {
        setValidationError("Data models must be JSON files");
      }
    }
  };

  const validateDataModelFile = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const content = JSON.parse(text);
      
      // Check for required structure
      if (!content || typeof content !== 'object') {
        setValidationError("Invalid JSON format");
        return false;
      }
      
      if (!content.entities || !Array.isArray(content.entities)) {
        setValidationError("JSON must contain an 'entities' array");
        return false;
      }
      
      if (!content.relationships || !Array.isArray(content.relationships)) {
        setValidationError("JSON must contain a 'relationships' array");
        return false;
      }
      
      return true;
    } catch (error) {
      setValidationError("Unable to parse JSON file");
      return false;
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    // Special validation for data model files
    if (docType === "data-model") {
      if (!file.name.toLowerCase().endsWith('.json')) {
        setValidationError("Data models must be JSON files");
        return;
      }
      
      const isValid = await validateDataModelFile(file);
      if (!isValid) {
        return;
      }
    }

    console.log("Starting upload process with file:", file.name);
    setUploading(true);
    
    try {
      const result = await uploadDocument({
        projectId,
        type: docType,
      }, file);
      
      console.log("Upload document result:", result);
      
      setFile(null);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error) {
      console.error("Error in upload handler:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="docType">Document Type</Label>
        <Select
          value={docType}
          onValueChange={(value) => {
            setDocType(value as DocumentType);
            setValidationError(null);
            setFile(null);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="file">Select File</Label>
        <Input
          id="file"
          type="file"
          onChange={handleFileChange}
          accept={docType === "data-model" ? ".json" : ".pdf,.doc,.docx"}
          className="cursor-pointer"
        />
        {docType === "data-model" && (
          <p className="text-xs text-muted-foreground">
            JSON file must contain 'entities' and 'relationships' arrays.
          </p>
        )}
      </div>
      
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <Button
        type="submit"
        disabled={!file || uploading || !!validationError}
        className="w-full"
      >
        {uploading ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload Document</>}
      </Button>
    </form>
  );
};

export default DocumentUpload;
