export type PodsRow = {
  issuer: string;
  username: string;
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
