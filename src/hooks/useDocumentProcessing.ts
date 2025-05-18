
import { useState } from "react";
import { DocumentMetadata, DocumentChunk } from "@/types";
import { supabase } from "@/lib/supabase";

export const useDocumentProcessing = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentMetadata = async (projectId?: string): Promise<DocumentMetadata[]> => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase.from("document_metadata").select("*");
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data.map((doc: any) => ({
        id: doc.id,
        projectId: doc.project_id,
        title: doc.title,
        filename: doc.filename,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        sourceUrl: doc.source_url,
        uploadDate: doc.upload_date,
        lastProcessedDate: doc.last_processed_date,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }));
    } catch (err: any) {
      console.error("Error fetching document metadata:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    projectId: string,
    file: File,
    title?: string
  ): Promise<DocumentMetadata | null> => {
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
      const { data: fileData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (!fileData) {
        throw new Error("Failed to get file URL");
      }
      
      // Step 2: Create document record
      const { data, error: insertError } = await supabase
        .from("document_metadata")
        .insert({
          project_id: projectId,
          title: title || file.name,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          source_url: fileData.publicUrl,
        })
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      // Step 3: Process document
      const { error: processError } = await supabase.functions.invoke("process-document", {
        body: { documentId: data.id },
      });
      
      if (processError) {
        console.error("Error processing document:", processError);
        // Continue despite processing error
      }
      
      return {
        id: data.id,
        projectId: data.project_id,
        title: data.title,
        filename: data.filename,
        fileType: data.file_type,
        fileSize: data.file_size,
        sourceUrl: data.source_url,
        uploadDate: data.upload_date,
        lastProcessedDate: data.last_processed_date,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get document to find source_url
      const { data: document, error: fetchError } = await supabase
        .from("document_metadata")
        .select("source_url")
        .eq("id", documentId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Delete from storage if possible
      if (document.source_url) {
        const filePath = document.source_url.split("/").pop();
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([`documents/${filePath}`]);
          
          if (storageError) {
            console.warn("Error deleting file from storage:", storageError);
            // Continue despite storage error
          }
        }
      }
      
      // Delete document metadata (will cascade to document_content)
      const { error: deleteError } = await supabase
        .from("document_metadata")
        .delete()
        .eq("id", documentId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      return true;
    } catch (err: any) {
      console.error("Error deleting document:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const queryDocuments = async (
    query: string,
    projectId?: string
  ): Promise<{ chunks: DocumentChunk[], answer?: string }> => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the query-documents function
      const { data, error } = await supabase.functions.invoke("query-documents", {
        body: {
          query,
          projectId,
          generateAnswer: true
        },
      });
      
      if (error) {
        throw error;
      }
      
      return {
        chunks: data.chunks.map((chunk: any) => ({
          id: chunk.id,
          documentId: chunk.document_id,
          chunkIndex: chunk.chunk_index,
          chunkText: chunk.chunk_text,
          similarity: chunk.similarity,
        })),
        answer: data.answer,
      };
    } catch (err: any) {
      console.error("Error querying documents:", err);
      setError(err.message);
      return { chunks: [] };
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchDocumentMetadata,
    uploadDocument,
    deleteDocument,
    queryDocuments,
    loading,
    error
  };
};
