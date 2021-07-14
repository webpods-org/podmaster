export type SqliteBoolean = 1 | 0;

export type PodsRow = {
  iss: string;
  sub: string;
  pod: string;
  hostname: string;
  hostname_alias: string | null;
  created_at: number;
  data_dir: string;
  tier: string;
};

export type LogsRow = {
  log: string;
  public: SqliteBoolean;
  created_at: number;
  tags: string | null;
};

export type EntriesRow = {
  id: number;
  content_hash: string;
  commit: string;
  previous_commit: string;
  log: string;
  type: "data" | "file";
  data: string;
  created_at: number;
  iss: string;
  sub: string;
};

export type PermissionsRow = {
  log: string;
  iss: string;
  sub: string;
  read: SqliteBoolean;
  write: SqliteBoolean;
  admin: SqliteBoolean;
  metadata: SqliteBoolean;
  publish: SqliteBoolean;
  subscribe: SqliteBoolean;
  created_at: number;
};
