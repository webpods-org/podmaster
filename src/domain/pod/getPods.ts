import * as db from "../../db";
import * as path from "path";
import * as config from "../../config";
import mapper from "../../mappers/pod";
import { Result } from "../../types/api";

export type GetPodsResult = {
  pods: {
    hostname: string;
    dataDir: string;
    hostnameAlias: string | null;
  }[];
};

export async function getPods(
  iss: string,
  sub: string
): Promise<Result<GetPodsResult>> {
  const appConfig = config.get();
  const systemDb = db.getSystemDb();
  const podInfoStmt = systemDb.prepare(
    `SELECT * FROM "pods" WHERE "iss"=@iss AND "sub"=@sub`
  );

  // See if it's already in predefined.
  function getPodsFromConfig() {
    return appConfig.pods
      ? appConfig.pods.filter(
          (x) => x.claims.iss === iss && x.claims.sub === sub
        )
      : [];
  }

  function getPodsFromDb() {
    const podInfoStmt = systemDb.prepare(
      `SELECT * FROM "pods" WHERE "iss"=@iss AND "sub"=@sub`
    );

    return podInfoStmt.all({ iss, sub }).map(mapper);
  }

  const pods = getPodsFromConfig()
    .concat(getPodsFromDb())
    .map((x) => ({
      hostname: x.hostname,
      hostnameAlias: x.hostnameAlias,
      dataDir: `${path.join(appConfig.storage.dataDir, x.dataDir)}`,
    }));

  return { ok: true, pods };
}
