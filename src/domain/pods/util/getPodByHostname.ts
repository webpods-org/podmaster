import * as config from "../../../config/index.js";
import * as db from "../../../db/index.js";
import mapper from "../../../mappers/pod.js";
import { PodInfo } from "../../../types/types.js";

export default async function getPodByHostname(
  hostname: string
): Promise<PodInfo | undefined> {
  const appConfig = config.get();
  const systemDb = db.getSystemDb();

  function getPodFromConfig() {
    return appConfig.pods
      ? appConfig.pods.find((x) => x.hostname === hostname)
      : undefined;
  }

  function getPodFromDb() {
    const podInfoStmt = systemDb.prepare(
      `SELECT * FROM "pods" WHERE "hostname"=@hostname OR "hostname_alias"=@hostname`
    );

    const dbRow = podInfoStmt.get({ hostname });

    return dbRow ? mapper(dbRow) : undefined;
  }

  return getPodFromConfig() || getPodFromDb();
}
