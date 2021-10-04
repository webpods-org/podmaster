import * as db from "../../../db/index.js";
import * as config from "../../../config/index.js";
import mapper from "../../../mappers/pod.js";
import { LimitedPodInfo } from "../../../types/index.js";

export default async function getPods(
  iss: string,
  sub: string
): Promise<LimitedPodInfo[]> {
  const appConfig = config.get();
  const systemDb = db.getSystemDb();

  // See if it's already in predefined.
  function getPodsFromConfig() {
    return appConfig.pods
      ? appConfig.pods.filter(
          (x) => x.createdBy.iss === iss && x.createdBy.sub === sub
        )
      : [];
  }

  function getPodsFromDb() {
    const podInfoStmt = systemDb.prepare(
      `SELECT * FROM "pod" WHERE "iss"=@iss AND "sub"=@sub`
    );

    return podInfoStmt.all({ iss, sub }).map(mapper);
  }

  return getPodsFromConfig().concat(getPodsFromDb());
}
