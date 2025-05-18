
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
  bitbucket_url?: string;
  google_drive_url?: string;
  jira_url?: string;
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

export interface DocumentMetadata {
  id: string;
  projectId: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize?: number;
  sourceUrl?: string;
  uploadDate: string;
  lastProcessedDate?: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 
  | "pending" 
  | "processing" 
  | "completed" 
  | "failed" 
  | "queued";

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  similarity?: number;
}

export interface ProcessingLog {
  id: string;
  documentId: string;
  eventType: string;
  status: string;
  message?: string;
  processingTime?: number;
  createdAt: string;
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
