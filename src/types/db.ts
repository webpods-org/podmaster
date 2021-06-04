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
  pod: string;
  log: string;
  created_at: number;
  tags: string | null;
};

export type EntriesRow = {
  id: number;
  commit: string;
  previous_commit: string;
  log: string;
  data: string;
  created_at: number;
};

export type PermissionsRow = {
  log: string;
  iss: string;
  sub: string;
  read: number;
  write: number;
  admin: number;
  metadata: number;
  created_at: number;
};
