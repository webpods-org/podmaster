import * as db from "../../db";
import * as path from "path";
import * as config from "../../config";
import { DomainResult } from "../../types/api";
import mapper from "../../mappers/pod";

export type GetPodsResult = {
  pods: {
    hostname: string;
    dataDir: string;
    hostnameAlias: string | null;
  }[];
};

export async function getPods(
  issuer: string,
  subject: string
): Promise<DomainResult<GetPodsResult>> {
  const appConfig = config.get();
  const systemDb = db.getSystemDb();
  const podInfoStmt = systemDb.prepare(
    "SELECT * FROM pods WHERE issuer=@issuer AND subject=@subject"
  );

  // See if it's already in predefined.
  function getPodsFromConfig() {
    return appConfig.pods
      ? appConfig.pods.filter(
          (x) => x.issuer === issuer && x.subject === subject
        )
      : [];
  }

  function getPodsFromDb() {
    const podInfoStmt = systemDb.prepare(
      "SELECT * FROM pods WHERE issuer=@issuer AND subject=@subject"
    );

    return podInfoStmt.all({ issuer, subject: subject }).map(mapper);
  }

  const pods = getPodsFromConfig()
    .concat(getPodsFromDb())
    .map((x) => ({
      hostname: x.hostname,
      hostnameAlias: x.hostnameAlias,
      dataDir: `${path.join(appConfig.storage.dataDir, x.dataDir)}`,
    }));

  return {
    success: true,
    pods,
  };
}
