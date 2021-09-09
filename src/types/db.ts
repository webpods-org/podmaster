import { EntryContentTypes } from "./types.js";

export type SqliteBoolean = 1 | 0;

export type PodsRow = {
  iss: string;
  sub: string;
  id: string;
  name: string;
  hostname: string;
  hostname_alias: string | null;
  created_at: number;
  tier: string;
  description: string;
};

export type LogsRow = {
  id: string;
  name: string;
  description: string;
  public: SqliteBoolean;
  created_at: number;
};

export type EntriesRow = {
  id: number;
  content_hash: string;
  commit: string;
  previous_commit: string;
  log_id: string;
  type: EntryContentTypes;
  data: string;
  created_at: number;
  iss: string;
  sub: string;
};

export type PodPermissionsRow = {
  iss: string;
  sub: string;
  admin: SqliteBoolean;
  read: SqliteBoolean;
  write: SqliteBoolean;
  created_at: number;
};

export type LogPermissionsRow = {
  log_id: string;
  iss: string;
  sub: string;
  read: SqliteBoolean;
  write: SqliteBoolean;
  publish: SqliteBoolean;
  subscribe: SqliteBoolean;
  created_at: number;
};
