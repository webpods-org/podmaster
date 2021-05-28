import * as db from "../../db";
import * as path from "path";
import * as config from "../../config";
import { APIResult } from "../../types/api";
import { PodsRow } from "../../types/db";

export type PodInfo = {
  hostname: string;
  userDir: string;
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

  const pods = dbResults.map((result) => {
    return {
      hostname: result.hostname,
      hostnameAlias: result.hostname_alias,
      userDir: `${path.join(appConfig.storage.dataDir, result.dir)}`,
    };
  });
  return {
    success: true,
    pods,
  };
}
