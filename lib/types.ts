export interface CkanOrg {
  id?: string;
  name: string;
  title?: string;
  image_url?: string;
}

export interface CkanTag {
  id?: string;
  name: string;
  display_name?: string;
}

export interface CkanResource {
  id: string;
  name?: string;
  description?: string;
  format?: string;
  url?: string;
  datastore_active?: boolean;
  size?: number | null;
  created?: string;
  last_modified?: string;
}

export interface CkanDataset {
  id: string;
  name: string;
  title?: string;
  notes?: string;
  metadata_created?: string;
  metadata_modified?: string;
  license_title?: string;
  license_id?: string;
  organization?: CkanOrg | null;
  resources?: CkanResource[];
  tags?: CkanTag[];
  num_resources?: number;
}

export interface CkanSearchResult {
  count: number;
  results: CkanDataset[];
}

export interface CkanDatastoreField {
  id: string;
  type: string;
}

export interface CkanDatastoreResult {
  resource_id?: string;
  total: number;
  records: Record<string, unknown>[];
  fields: CkanDatastoreField[];
}

export type Language = "he" | "en";

export interface SearchFilters {
  query: string;
  org: string | null;
  tags: string[];
  format: string | null;
  page: number;
}
