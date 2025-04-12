
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
import { Upload } from "lucide-react";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      // In a real app, we would upload the file to storage here
      // and get back a URL. For now, we'll create a fake URL
      const fakeFileUrl = `/uploads/${file.name}`;
      
      await uploadDocument({
        projectId,
        name: file.name,
        type: docType,
        fileUrl: fakeFileUrl,
        fileType: file.type,
      });
      
      setFile(null);
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error("Error uploading document:", error);
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
          onValueChange={(value) => setDocType(value as DocumentType)}
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
      </div>
      
      <Button
        type="submit"
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? (
          "Uploading..."
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
