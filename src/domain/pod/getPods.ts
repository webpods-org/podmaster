import * as db from "../../db/index.js";
import * as config from "../../config/index.js";
import mapper from "../../mappers/pod.js";
import { Result } from "../../types/api.js";
import { getPodDataDir } from "../../storage/index.js";

export type GetPodsResult = {
  pods: {
    hostname: string;
    name: string;
    description: string;
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
      name: x.name,
      description: x.description,
      dataDir: getPodDataDir(x.id),
    }));

  return { ok: true, value: { pods } };
}
