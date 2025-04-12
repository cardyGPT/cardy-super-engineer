
export type ProjectType = 
  | "Child Welfare" 
  | "Child Support" 
  | "Juvenile Justice";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  details: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 
  | "data-model" 
  | "system-requirements" 
  | "coding-guidelines" 
  | "technical-design";

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  content?: any;
}

export interface Entity {
  id: string;
  name: string;
  definition: string;
  type: "entity" | "sub-entity";
  attributes: Attribute[];
}

export interface Attribute {
  id: string;
  name: string;
  type: string;
  required: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  description?: string;
}

export interface Relationship {
  id: string;
  name: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceCardinality: string;
  targetCardinality: string;
  description?: string;
}

export interface DataModel {
  entities: Entity[];
  relationships: Relationship[];
}
