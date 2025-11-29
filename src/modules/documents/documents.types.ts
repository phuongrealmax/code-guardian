// src/modules/documents/documents.types.ts

export interface Document {
  id: string;
  path: string;
  name: string;
  type: DocumentType;
  createdAt: Date;
  updatedAt: Date;
  hash: string;
  size: number;
  description?: string;
  tags: string[];
  linkedFiles: string[];
}

export type DocumentType =
  | 'readme'
  | 'spec'
  | 'api'
  | 'guide'
  | 'changelog'
  | 'architecture'
  | 'config'
  | 'other';

export interface DocumentRegistry {
  documents: Document[];
  lastScanned: Date;
  locations: Record<string, string>;
}

export interface DocumentSearchResult {
  document: Document;
  relevance: number;
  matchedIn: ('name' | 'description' | 'tags' | 'content')[];
}

export interface DocumentUpdateCheck {
  document: Document;
  shouldUpdate: boolean;
  reason: string;
  existingContent?: string;
  suggestedAction: 'update' | 'create' | 'skip';
}

export interface DocumentCreateParams {
  path: string;
  type?: DocumentType;
  description?: string;
  tags?: string[];
  content: string;
}

export interface DocumentsModuleStatus {
  enabled: boolean;
  documentCount: number;
  byType: Record<string, number>;
  lastScanned: Date;
}
