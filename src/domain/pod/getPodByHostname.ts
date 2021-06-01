import * as config from "../../config";
import * as db from "../../db";
import mapper from "../../mappers/pod";
import { PodInfo } from "../../types/types";

export async function getPodByHostname(
  issuer: string,
  username: string,
  hostname: string
): Promise<PodInfo | undefined> {
  const appConfig = config.get();
  const systemDb = db.getSystemDb();

  function getPodFromConfig() {
    return appConfig.pods
      ? appConfig.pods.find(
          (x) =>
            x.issuer === issuer &&
            x.username === username &&
            (x.hostname === hostname || x.hostnameAlias === hostname)
        )
      : undefined;
  }

  function getPodFromDb() {
    const podInfoStmt = systemDb.prepare(
      "SELECT * FROM pods WHERE issuer=@issuer AND username=@username AND (hostname=@hostname OR hostname_alias=@hostname)"
    );

    const dbRow = podInfoStmt.get({
      issuer: issuer,
      username: username,
      hostname,
    });

    return dbRow ? mapper(dbRow) : undefined;
  }

  return getPodFromConfig() || getPodFromDb();
}
