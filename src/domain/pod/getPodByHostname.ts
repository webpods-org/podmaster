import * as config from "../../config";
import * as db from "../../db";
import mapper from "../../mappers/pod";
import { PodInfo } from "../../types/types";

export async function getPodByHostname(
  issuer: string,
  subject: string,
  hostname: string
): Promise<PodInfo | undefined> {
  const appConfig = config.get();
  const systemDb = db.getSystemDb();

  function getPodFromConfig() {
    return appConfig.pods
      ? appConfig.pods.find(
          (x) =>
            x.issuer === issuer &&
            x.subject === subject &&
            (x.hostname === hostname || x.hostnameAlias === hostname)
        )
      : undefined;
  }

  function getPodFromDb() {
    const podInfoStmt = systemDb.prepare(
      `SELECT * FROM "pods" WHERE "issuer"=@issuer AND "subject"=@subject AND ("hostname"=@hostname OR "hostname_alias"=@hostname)`
    );

    const dbRow = podInfoStmt.get({
      issuer: issuer,
      subject: subject,
      hostname,
    });

    return dbRow ? mapper(dbRow) : undefined;
  }

  return getPodFromConfig() || getPodFromDb();
}
