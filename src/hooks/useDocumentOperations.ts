
import { useCallback } from "react";
import { ProjectDocument, DataModel } from "@/types";
import { supabase } from "@/lib/supabase";
import { ToastActionElement } from "@/components/ui/toast";

type Toast = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

export const useDocumentOperations = (
  documents: ProjectDocument[],
  setDocuments: React.Dispatch<React.SetStateAction<ProjectDocument[]>>,
  setDataModel: React.Dispatch<React.SetStateAction<DataModel | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: (props: Toast) => void
) => {
  const uploadDocument = async (documentData: Partial<ProjectDocument>, file: File) => {
    setLoading(true);
    try {
      console.log("Starting document upload process:", { documentData, fileName: file.name });
      
      // First upload the file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      
      console.log("Uploading file to storage:", fileName);
      
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      
      console.log("File uploaded successfully:", fileData);
      
      // Create a public URL for the file
      const { data: urlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      console.log("Generated public URL:", urlData);
      
      let fileContent = null;
      
      // If it's a data model, attempt to parse the JSON content
      if (documentData.type === "data-model") {
        try {
          const text = await file.text();
          fileContent = JSON.parse(text);
          
          // Basic validation of data model structure
          if (!fileContent.entities || !Array.isArray(fileContent.entities) || 
              !fileContent.relationships || !Array.isArray(fileContent.relationships)) {
            throw new Error("Invalid data model format");
          }
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          toast({
            title: "Error parsing JSON",
            description: "The data model file is not valid JSON or has incorrect format.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }
      
      // Map client model to database columns
      const newDocument = {
        project_id: documentData.projectId || "",
        name: file.name,
        type: documentData.type || "system-requirements",
        file_url: urlData.publicUrl,
        file_type: file.type,
        content: fileContent,
      };
      
      console.log("Inserting document record:", newDocument);
      
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([newDocument])
        .select()
        .single();
      
      if (docError) {
        console.error("Database insert error:", docError);
        throw docError;
      }
      
      console.log("Document inserted successfully:", docData);
      
      // Map database response to client model
      const formattedDocument: ProjectDocument = {
        id: docData.id,
        projectId: docData.project_id,
        name: docData.name,
        type: docData.type,
        fileUrl: docData.file_url,
        fileType: docData.file_type,
        uploadedAt: docData.uploaded_at,
        content: docData.content,
      };
      
      setDocuments((prev) => [...prev, formattedDocument]);
      
      if (formattedDocument.type === "data-model" && formattedDocument.content) {
        setDataModel(formattedDocument.content);
      }
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      });
      
      return formattedDocument;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setLoading(true);
    try {
      // First get the document to find the file path
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete the file from storage if we have a URL
      if (doc.file_url) {
        const fileName = doc.file_url.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([fileName]);
          
          if (storageError) console.error("Error removing file from storage:", storageError);
        }
      }
      
      // Delete the document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadDocument,
    deleteDocument
  };
};
