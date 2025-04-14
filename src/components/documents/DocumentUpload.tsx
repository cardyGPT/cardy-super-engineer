
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
import { Upload, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogClose } from "@/components/ui/dialog";

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
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setUploadSuccess(false);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Validate file type based on document type
      if (docType === "data-model" && !selectedFile.name.toLowerCase().endsWith('.json')) {
        setValidationError("Data models must be JSON files");
        return;
      }
      
      if (docType !== "data-model" && 
          !selectedFile.name.toLowerCase().endsWith('.pdf') && 
          !selectedFile.name.toLowerCase().endsWith('.doc') && 
          !selectedFile.name.toLowerCase().endsWith('.docx')) {
        setValidationError(`${DOCUMENT_TYPES.find(d => d.value === docType)?.label} must be PDF or Word documents`);
        return;
      }
    }
  };

  const validateDataModelFile = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const content = JSON.parse(text);
      
      if (!content || typeof content !== 'object') {
        setValidationError("Invalid JSON format");
        return false;
      }
      
      if (Array.isArray(content)) {
        return true;
      }
      
      if (content.entities && typeof content.entities === 'object') {
        return true;
      }
      
      setValidationError("JSON must contain entities data in a recognized format");
      return false;
    } catch (error) {
      setValidationError("Unable to parse JSON file");
      return false;
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setUploadSuccess(false);
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    if (!projectId) {
      toast({
        title: "Project required",
        description: "A project ID is required to upload documents",
        variant: "destructive",
      });
      return;
    }

    // Validate file type again
    if (docType === "data-model") {
      if (!file.name.toLowerCase().endsWith('.json')) {
        setValidationError("Data models must be JSON files");
        return;
      }
      
      toast({
        title: "Validating JSON",
        description: "Checking data model format...",
      });
      
      const isValid = await validateDataModelFile(file);
      if (!isValid) {
        toast({
          title: "Validation failed",
          description: validationError || "Invalid JSON format",
          variant: "destructive",
        });
        return;
      }
    } else if (!file.name.toLowerCase().endsWith('.pdf') && 
              !file.name.toLowerCase().endsWith('.doc') && 
              !file.name.toLowerCase().endsWith('.docx')) {
      setValidationError(`${DOCUMENT_TYPES.find(d => d.value === docType)?.label} must be PDF or Word documents`);
      return;
    }

    console.log("Starting upload process with file:", file.name, "for project:", projectId);
    setUploading(true);
    
    toast({
      title: "Uploading document",
      description: `Uploading ${file.name}...`,
    });
    
    try {
      const result = await uploadDocument({
        projectId,
        type: docType,
      }, file);
      
      console.log("Upload document result:", result);
      
      setFile(null);
      setUploadSuccess(true);
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
        variant: "default",
      });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      setTimeout(() => {
        const closeButton = document.querySelector('[data-dialog-close]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error in upload handler:", error);
      
      let errorMessage = "There was an error uploading your document. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("storage")) {
          errorMessage = "Storage error: Failed to store the file. Please try again.";
        } else if (error.message.includes("format")) {
          errorMessage = "Format error: The file format is not supported.";
        }
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
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
            setUploadSuccess(false);
            setFile(null);
          }}
        >
          <SelectTrigger id="project-select" className="w-full">
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
          disabled={uploading}
        />
        {docType === "data-model" && (
          <p className="text-xs text-gray-500">
            Upload a JSON file containing your data model. Several formats are supported.
          </p>
        )}
        {docType !== "data-model" && (
          <p className="text-xs text-gray-500">
            Upload a PDF or Word document for {DOCUMENT_TYPES.find(d => d.value === docType)?.label.toLowerCase()}.
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
      
      {uploadSuccess && (
        <Alert className="bg-[#F2FCE2] text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Document uploaded successfully!</AlertDescription>
        </Alert>
      )}
      
      <Button
        type="submit"
        disabled={!file || uploading || !!validationError}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Upload Document
          </>
        )}
      </Button>
    </form>
  );
};

export default DocumentUpload;
