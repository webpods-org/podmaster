import * as config from "../../config";
import * as db from "../../db";
import { join } from "path";
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";
import { EntriesRow } from "../../types/db";
import mapper from "../../mappers/entry";
import { LogEntry } from "../../types/types";
import { ACCESS_DENIED } from "../../errors/codes";
import permissionsMapper from "../../mappers/permission";
import { getPermissionsForLog } from "./checkPermissionsForLog";

export type GetEntriesResult = {
  entries: LogEntry[];
};

export default async function getEntries(
  iss: string,
  sub: string,
  hostname: string,
  log: string,
  fromId?: number,
  fromCommit?: string,
  commaSeperatedCommits?: string,
  maxResults?: number
): Promise<Result<GetEntriesResult>> {
  const limit = maxResults || 100;
  const appConfig = config.get();

  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);

    const permissions = await getPermissionsForLog(pod, iss, sub, log, podDb);

    // Entries can be read if either a) is owner, or b) granted permissions.
    function checkPermissions() {
      const getPermissionsStmt = podDb.prepare(
        `SELECT * FROM "permissions" WHERE "log" = @log`
      );

      const permissions = getPermissionsStmt
        .all({ log })
        .map(permissionsMapper);

      return permissions.some(
        (x) => x.claims.iss === iss && x.claims.sub === sub && x.access.read
      );
    }

    const hasPermissions =
      (pod.claims.iss === iss && pod.claims.sub === sub) || checkPermissions();
    if (hasPermissions) {
      function getEntriesAfterId(id: number) {
        const getEntriesStmt = podDb.prepare(
          `SELECT * FROM "entries" WHERE "log" = @log AND "id" > @id LIMIT @count`
        );

        return getEntriesStmt.all({
          id,
          log,
          count: limit,
        }) as EntriesRow[];
      }

      function getEntriesAfterCommit(commit: string) {
        const getCommitStmt = podDb.prepare(
          `SELECT "id" FROM "entries" WHERE "log" = @log AND "commit" = @commit`
        );

        const commitRow: EntriesRow = getCommitStmt.get({
          log,
          commit,
        });

        if (commitRow) {
          return getEntriesAfterId(commitRow.id);
        } else {
          return [] as EntriesRow[];
        }
      }

      function getEntriesByCommits(commaSeperatedCommits: string) {
        const commitList = commaSeperatedCommits
          .split(",")
          .map((x) => x.trim());

        const commitRows: EntriesRow[] = [];

        for (const commit of commitList) {
          const getSingleCommitStmt = podDb.prepare(
            `SELECT * FROM "entries" WHERE "log" = @log AND "commit" = @commit`
          );

          const commitRow = getSingleCommitStmt.get({ log, commit: commit });

          if (commitRow) {
            commitRows.push(commitRow);

            if (commitRows.length === limit) {
              return commitRows;
            }
          }
        }

        return commitRows;
      }

      const dbEntries = fromId
        ? getEntriesAfterId(fromId)
        : fromCommit
        ? getEntriesAfterCommit(fromCommit)
        : commaSeperatedCommits
        ? getEntriesByCommits(commaSeperatedCommits)
        : getEntriesAfterId(0);

      if (dbEntries) {
        const entries = dbEntries.map(mapper);
        return { ok: true, entries };
      } else {
        return { ok: true, entries: [] };
      }
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
