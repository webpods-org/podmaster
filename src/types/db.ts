export type PodsRow = {
  identity_issuer: string;
  identity_username: string;
  pod_id: string;
  hostname: string;
  hostname_alias: string | null;
  created_at: string;
  data_dir: string;
  tier: string;
};
