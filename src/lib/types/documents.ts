export interface DocumentModel {
  id: number;
  uuid: string;
  title: string;
  content: string;
  content_draft: string | null;
  is_draft: boolean;
  project_id: number | null;
  deployment_id: string | null;
  tags: any; // JSON array of strings
  created_at: string | null;
  updated_at: string | null;
  last_edited_at: string | null;
}

export interface CreateDocumentRequest {
  title: string;
  content: string;
  project_id?: number | null;
  deployment_id?: string | null;
  tags?: string[] | null;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  tags?: string[] | null;
}

export interface DocumentFilters {
  query?: string;
  project_id?: number | null;
  tags?: string[] | null;
}

export interface DocumentStats {
  total: number;
  drafts: number;
  linked_to_projects: number;
  linked_to_deployments: number;
}
