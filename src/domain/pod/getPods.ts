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
  username: string
): Promise<DomainResult<GetPodsResult>> {
  const appConfig = config.get();
  const sqlite = db.getSystemDb();
  const podInfoStmt = sqlite.prepare(
    "SELECT * FROM pods WHERE issuer=@issuer AND username=@username"
  );

  // See if it's already in predefined.
  function getPodsFromConfig() {
    return appConfig.pods
      ? appConfig.pods.filter(
          (x) => x.issuer === issuer && x.username === username
        )
      : [];
  }

  function getPodsFromDb() {
    const podInfoStmt = sqlite.prepare(
      "SELECT * FROM pods WHERE issuer=@issuer AND username=@username"
    );

    return podInfoStmt.all({ issuer, username }).map(mapper);
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
