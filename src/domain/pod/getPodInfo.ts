import { JwtClaims } from "../../types/config";
import * as db from "../../db";
  
export type PodInfo = {
  hostname: string;
  dataDir: string;
};

export async function getPodInfo(
  claims: JwtClaims
): Promise<PodInfo | undefined> {
  const sqlite = db.get();
  const podInfoStmt = sqlite.prepare(
    "SELECT * FROM pods WHERE user_id=@user_id"
  );
  const { hostname, dir } = podInfoStmt.get({ user_id: userId });
  return {
    hostname,
    dataDir: `${path.join(appConfig.storage.baseDataDir, dir)}`,
  };
}
