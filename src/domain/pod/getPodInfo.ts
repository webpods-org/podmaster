import * as db from "../../db";
import * as path from "path";
import * as config from "../../config";

export type PodInfo = {
  hostname: string;
  userDir: string;
};

export async function getPodInfo(
  issuer: string,
  username: string
): Promise<PodInfo | null> {
  const appConfig = config.get();
  const sqlite = db.get();
  const podInfoStmt = sqlite.prepare(
    "SELECT * FROM pods WHERE identity_issuer=@issuer AND identity_username=@username"
  );

  const results = podInfoStmt.get({ issuer, username });

  if (results) {
    const { hostname, dir } = results;
    return {
      hostname,
      userDir: `${path.join(appConfig.storage.dataDir, dir)}`,
    };
  } else {
    return null;
  }
}
