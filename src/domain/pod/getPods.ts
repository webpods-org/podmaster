import * as db from "../../db";
import * as path from "path";
import * as config from "../../config";
import { APIResult } from "../../types/api";
import { PodsRow } from "../../types/db";
import { hostname } from "os";

export type PodInfo = {
  hostname: string;
  dataDir: string;
  hostnameAlias: string | null;
};

export async function getPods(
  issuer: string,
  username: string
): Promise<APIResult<{ pods: PodInfo[] }>> {
  const appConfig = config.get();
  const sqlite = db.get();
  const podInfoStmt = sqlite.prepare(
    "SELECT * FROM pods WHERE identity_issuer=@issuer AND identity_username=@username"
  );

  const dbResults: PodsRow[] = podInfoStmt.all({ issuer, username });

  const predefinedPods = appConfig.pods
    ? appConfig.pods.map((x) => ({
        hostname: x.hostname,
        hostnameAlias: x.hostnameAlias,
        dataDir: x.dataDir,
      }))
    : [];

  const podsInDb = dbResults.map((result) => {
    return {
      hostname: result.hostname,
      hostnameAlias: result.hostname_alias,
      dataDir: `${path.join(appConfig.storage.dataDir, result.data_dir)}`,
    };
  });

  return {
    success: true,
    pods: predefinedPods.concat(podsInDb),
  };
}
