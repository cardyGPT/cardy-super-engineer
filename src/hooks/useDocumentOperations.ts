
import { useState } from "react";
import { ProjectDocument, DataModel } from "@/types";
import { supabase } from "@/lib/supabase";

export const useDocumentOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async (projectId: string): Promise<ProjectDocument[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data.map((doc: any) => ({
        id: doc.id,
        projectId: doc.project_id,
        name: doc.name,
        type: doc.type,
        fileUrl: doc.file_url,
        fileType: doc.file_type,
        uploadedAt: doc.uploaded_at,
        content: doc.content,
      })) || [];
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    document: Partial<ProjectDocument>, 
    file: File,
    documentList: ProjectDocument[],
    setDocumentList: React.Dispatch<React.SetStateAction<ProjectDocument[]>>,
    setDataModel: React.Dispatch<React.SetStateAction<DataModel | null>>
  ): Promise<ProjectDocument | undefined> => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `documents/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: fileUrl } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (!fileUrl) {
        throw new Error("Failed to get file URL");
      }
      
      // Step 2: Create document record
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert([{
          project_id: document.projectId,
          name: document.name || file.name,
          type: document.type || 'other',
          file_url: fileUrl.publicUrl,
          file_type: file.type
        }])
        .select()
        .single();
      
      if (docError) {
        throw docError;
      }
      
      // Step 3: Process the document content if needed
      if (file.type === 'application/json' || file.type === 'application/pdf') {
        try {
          const { data: processData, error: processError } = await supabase.functions.invoke('process-document', {
            body: {
              documentId: docData.id,
              fileUrl: fileUrl.publicUrl,
              fileType: file.type,
              projectId: document.projectId
            }
          });
          
          if (processError) {
            console.error("Error processing document:", processError);
          }
          
          if (processData && processData.dataModel && file.type === 'application/json') {
            setDataModel(processData.dataModel);
          }
        } catch (processErr) {
          console.error("Error invoking process-document function:", processErr);
        }
      }
      
      // Map to ProjectDocument type
      const newDocument: ProjectDocument = {
        id: docData.id,
        projectId: docData.project_id,
        name: docData.name,
        type: docData.type,
        fileUrl: docData.file_url,
        fileType: docData.file_type,
        uploadedAt: docData.uploaded_at,
        content: docData.content || null,
      };
      
      // Update state
      setDocumentList([newDocument, ...documentList]);
      
      return newDocument;
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setError(err.message);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (
    id: string,
    documentList: ProjectDocument[],
    setDocumentList: React.Dispatch<React.SetStateAction<ProjectDocument[]>>
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Find the document to get the file path
      const document = documentList.find(doc => doc.id === id);
      
      if (document && document.fileUrl) {
        // Extract the path from the URL
        const urlParts = document.fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `documents/${fileName}`;
        
        // Delete from storage (don't throw if this fails)
        try {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([filePath]);
          
          if (storageError) {
            console.warn("Error removing file from storage:", storageError);
          }
        } catch (storageErr) {
          console.warn("Error in storage deletion:", storageErr);
        }
      }
      
      // Delete document record
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw error;
      }
      
      // Update state
      setDocumentList(documentList.filter(doc => doc.id !== id));
    } catch (err: any) {
      console.error("Error deleting document:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    loading,
    error
  };
};
