import * as db from "../../db";
import * as path from "path";
import * as config from "../../config";

export type PodInfo = {
  hostname: string;
  userDir: string;
};

export async function getPodInfo(userId: string): Promise<PodInfo | undefined> {
  const appConfig = config.get();
  const sqlite = db.get();
  const podInfoStmt = sqlite.prepare(
    "SELECT * FROM pods WHERE user_id=@user_id"
  );  
  const { hostname, dir } = podInfoStmt.get({ user_id: userId });  
  return {
    hostname,
    userDir: `${path.join(appConfig.storage.dataDir, dir)}`,
  };
}
