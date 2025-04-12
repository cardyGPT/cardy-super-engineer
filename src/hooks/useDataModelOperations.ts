
import { useCallback } from "react";
import { ProjectDocument, DataModel } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useDataModelOperations = (documents: ProjectDocument[]) => {
  const getDocumentDataModel = useCallback((documentId: string): DataModel | null => {
    try {
      console.log("Getting data model for document:", documentId);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        console.log("Document not found:", documentId);
        return null;
      }
      
      if (document.type !== "data-model") {
        console.log("Document is not a data model:", document.type);
        return null;
      }
      
      if (!document.content) {
        console.log("Document has no content");
        return null;
      }
      
      console.log("Data model content found:", document.content);
      
      // Verify the content has the required structure
      if (!document.content.entities || !Array.isArray(document.content.entities) || 
          !document.content.relationships || !Array.isArray(document.content.relationships)) {
        console.error("Invalid data model structure:", document.content);
        return null;
      }
      
      return document.content as DataModel;
    } catch (error) {
      console.error("Error getting document data model:", error);
      return null;
    }
  }, [documents]);

  const validateDataModel = useCallback((content: any): boolean => {
    // Check for required structure
    if (!content || typeof content !== 'object') return false;
    if (!content.entities || !Array.isArray(content.entities)) return false;
    if (!content.relationships || !Array.isArray(content.relationships)) return false;
    
    // Validate each entity has required fields
    for (const entity of content.entities) {
      if (!entity.id || !entity.name || !entity.attributes || !Array.isArray(entity.attributes)) {
        return false;
      }
    }
    
    // Validate each relationship has required fields
    for (const rel of content.relationships) {
      if (!rel.id || !rel.sourceEntityId || !rel.targetEntityId) {
        return false;
      }
    }
    
    return true;
  }, []);

  return {
    getDocumentDataModel,
    validateDataModel
  };
};
