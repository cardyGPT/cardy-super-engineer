
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
          console.log("Parsing JSON data model content");
          fileContent = JSON.parse(text);
          
          // Basic validation for data model
          if (!fileContent) {
            throw new Error("Empty file content");
          }
          
          // Normalize the structure specifically for our data model format
          // This handles different common JSON formats users might upload
          fileContent = normalizeDataModelStructure(fileContent);
          
          console.log("Normalized data model structure:", {
            entities: fileContent.entities?.length || 0,
            relationships: fileContent.relationships?.length || 0
          });
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

  const normalizeDataModelStructure = (content: any) => {
    // If content is already normalized, return it
    if (content.entities && Array.isArray(content.entities) && 
        content.relationships && Array.isArray(content.relationships)) {
      return content;
    }
    
    let entities = [];
    let relationships = [];
    
    // Handle object-based entity format (common in some tools)
    if (content.entities && typeof content.entities === 'object' && !Array.isArray(content.entities)) {
      console.log("Converting object-based entities to array format");
      
      for (const [entityId, entityData] of Object.entries(content.entities)) {
        if (typeof entityData !== 'object') continue;
        
        const entityObj = entityData as any;
        
        // Create normalized entity
        const entity = {
          id: entityId,
          name: entityObj.name || entityId,
          definition: entityObj.definition || entityObj.description || '',
          type: (entityObj.type || 'entity'),
          attributes: []
        };
        
        // Process attributes/columns
        if (entityObj.attributes && Array.isArray(entityObj.attributes)) {
          entity.attributes = entityObj.attributes;
        } else if (entityObj.columns && Array.isArray(entityObj.columns)) {
          // Convert columns to attributes format
          entity.attributes = entityObj.columns.map((col: any) => {
            if (typeof col === 'string') {
              return {
                id: generateId(),
                name: col,
                type: 'string',
                required: false
              };
            } else {
              return {
                id: col.id || generateId(),
                name: col.name,
                type: col.type || 'string',
                required: col.required || false,
                isPrimaryKey: col.key === true || col.isPrimaryKey === true,
                isForeignKey: col.isForeignKey === true
              };
            }
          });
        }
        
        entities.push(entity);
      }
      
      // Process relationships
      if (content.relationships && Array.isArray(content.relationships)) {
        relationships = content.relationships.map((rel: any) => {
          return {
            id: rel.id || generateId(),
            name: rel.name || '',
            sourceEntityId: rel.source || rel.sourceEntityId || '',
            targetEntityId: rel.target || rel.targetEntityId || '',
            sourceCardinality: getCardinalityFromType(rel.type, 'source'),
            targetCardinality: getCardinalityFromType(rel.type, 'target'),
            description: rel.definition || rel.description || ''
          };
        });
      }
    } else if (Array.isArray(content)) {
      // Handle array of entities format (another common format)
      console.log("Converting array format to entity/relationship structure");
      
      entities = content.filter(item => item.type !== 'relationship').map(entity => ({
        id: entity.id || generateId(),
        name: entity.name,
        definition: entity.definition || entity.description || '',
        type: entity.type || 'entity',
        attributes: entity.attributes || []
      }));
      
      relationships = content.filter(item => item.type === 'relationship').map(rel => ({
        id: rel.id || generateId(),
        name: rel.name || '',
        sourceEntityId: rel.source || rel.sourceEntityId || '',
        targetEntityId: rel.target || rel.targetEntityId || '',
        sourceCardinality: rel.sourceCardinality || '1',
        targetCardinality: rel.targetCardinality || '1',
        description: rel.description || ''
      }));
    }
    
    return {
      entities: entities.length > 0 ? entities : (content.entities || []),
      relationships: relationships.length > 0 ? relationships : (content.relationships || [])
    };
  };

  // Helper function to generate a random ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Convert relationship type to cardinality notation
  const getCardinalityFromType = (type: string | undefined, end: 'source' | 'target'): string => {
    if (!type) return '1';
    
    type = type.toLowerCase();
    
    if (type === 'one-to-one' || type === '1:1') {
      return '1';
    } else if (type === 'one-to-many' || type === '1:m' || type === '1:n' || type === '1:*') {
      return end === 'source' ? '1' : '*';
    } else if (type === 'many-to-one' || type === 'm:1' || type === 'n:1' || type === '*:1') {
      return end === 'source' ? '*' : '1';
    } else if (type === 'many-to-many' || type === 'm:m' || type === 'n:n' || type === '*:*') {
      return '*';
    }
    
    return '1';
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
