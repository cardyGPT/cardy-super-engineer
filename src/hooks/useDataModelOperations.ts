
import { useCallback } from "react";
import { ProjectDocument, DataModel, Entity, Relationship, Attribute } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useDataModelOperations = (documents: ProjectDocument[]) => {
  const { toast } = useToast();
  
  // Generate a random ID for entities that don't have one
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Process and normalize entity attributes
  const processAttributes = (attributes: any[]): Attribute[] => {
    return attributes.map(attr => {
      // Handle different attribute formats
      const normalizedAttr: Attribute = {
        id: attr.id || generateId(),
        name: attr.name,
        type: attr.type || 'string',
        required: typeof attr.required === 'boolean' ? attr.required : Boolean(attr.key),
        description: attr.description || attr.definition || '',
      };
      
      // Handle primary and foreign keys
      if (attr.isPrimaryKey !== undefined) {
        normalizedAttr.isPrimaryKey = attr.isPrimaryKey;
      } else if (attr.key !== undefined) {
        normalizedAttr.isPrimaryKey = attr.key === true;
      }
      
      if (attr.isForeignKey !== undefined) {
        normalizedAttr.isForeignKey = attr.isForeignKey;
      }
      
      return normalizedAttr;
    });
  };

  // Normalize relationships
  const processRelationships = (relationships: any[], entities: Entity[]): Relationship[] => {
    return relationships.map(rel => {
      // Handle different relationship formats
      const normalizedRel: Relationship = {
        id: rel.id || generateId(),
        name: rel.name || '',
        sourceEntityId: rel.sourceEntityId || rel.source || '',
        targetEntityId: rel.targetEntityId || rel.target || '',
        sourceCardinality: rel.sourceCardinality || getCardinalityFromType(rel.type, 'source'),
        targetCardinality: rel.targetCardinality || getCardinalityFromType(rel.type, 'target'),
        description: rel.description || rel.definition || '',
      };
      
      return normalizedRel;
    });
  };

  // Convert relationship type to cardinality notation
  const getCardinalityFromType = (type: string | undefined, end: 'source' | 'target'): string => {
    if (!type) return '1';
    
    switch (type.toLowerCase()) {
      case 'one-to-one':
        return '1';
      case 'one-to-many':
        return end === 'source' ? '1' : '*';
      case 'many-to-one':
        return end === 'source' ? '*' : '1';
      case 'many-to-many':
        return '*';
      default:
        return '1';
    }
  };

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
      
      let content = document.content;
      
      // Handle both string and object content
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (e) {
          console.error("Error parsing JSON content:", e);
          return null;
        }
      }
      
      // Basic validation for required structure
      if (!content.entities || !Array.isArray(content.entities)) {
        console.error("Invalid data model: 'entities' array missing");
        return null;
      }
      
      if (!content.relationships || !Array.isArray(content.relationships)) {
        console.error("Invalid data model: 'relationships' array missing");
        return null;
      }
      
      // Process and normalize entities
      const entities: Entity[] = content.entities.map((entity: any) => ({
        id: entity.id || generateId(),
        name: entity.name || 'Unnamed Entity',
        definition: entity.definition || entity.description || '',
        type: entity.type === 'sub-entity' ? 'sub-entity' : 'entity',
        attributes: Array.isArray(entity.attributes) 
          ? processAttributes(entity.attributes) 
          : []
      }));
      
      // Process and normalize relationships
      const relationships = processRelationships(content.relationships, entities);
      
      // Return normalized data model
      return {
        entities,
        relationships
      };
    } catch (error) {
      console.error("Error getting document data model:", error);
      toast({
        title: "Error parsing data model",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      return null;
    }
  }, [documents, toast]);

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
      if (
        !rel.id || 
        (!rel.sourceEntityId && !rel.source) || 
        (!rel.targetEntityId && !rel.target)
      ) {
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
