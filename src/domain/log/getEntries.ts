import { join } from "path";

import * as config from "../../config/index.js";
import * as db from "../../db/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { EntriesRow } from "../../types/db.js";
import mapper from "../../mappers/entry.js";
import { LogEntry } from "../../types/types.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPermissionsForLog } from "./checkPermissionsForLog.js";
import { getPodDataDir } from "../../storage/index.js";

export type GetEntriesResult = {
  entries: LogEntry[];
};

export default async function getEntries(
  iss: string | undefined,
  sub: string | undefined,
  hostname: string,
  logName: string,
  fromId?: number,
  fromCommit?: string,
  commaSeperatedCommits?: string,
  maxResults?: number
): Promise<Result<GetEntriesResult>> {
  const limit = maxResults || 100;
  const appConfig = config.get();

  return ensurePod(hostname, async (pod) => {
    function getEntriesAfterId(id: number) {
      const getEntriesStmt = podDb.prepare(
        `SELECT * FROM "entries" WHERE "log_name" = @log_name AND "id" > @id LIMIT @count`
      );

      return getEntriesStmt.all({
        id,
        log_name: logName,
        count: limit,
      }) as EntriesRow[];
    }

    function getEntriesAfterCommit(commit: string) {
      const getCommitStmt = podDb.prepare(
        `SELECT "id" FROM "entries" WHERE "log_name" = @log_name AND "commit" = @commit`
      );

      const commitRow: EntriesRow = getCommitStmt.get({
        log_name: logName,
        commit,
      });

      if (commitRow) {
        return getEntriesAfterId(commitRow.id);
      } else {
        return [] as EntriesRow[];
      }
    }

    function getEntriesByCommits(commaSeperatedCommits: string) {
      const commitList = commaSeperatedCommits.split(",").map((x) => x.trim());

      const commitRows: EntriesRow[] = [];

      for (const commit of commitList) {
        const getSingleCommitStmt = podDb.prepare(
          `SELECT * FROM "entries" WHERE "log_name" = @log_name AND "commit" = @commit`
        );

        const commitRow = getSingleCommitStmt.get({
          log_name: logName,
          commit: commit,
        });

        if (commitRow) {
          commitRows.push(commitRow);

          if (commitRows.length === limit) {
            return commitRows;
          }
        }
      }

      return commitRows;
    }

    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.name);
    const podDb = db.getPodDb(podDataDir);

    const permissions = await getPermissionsForLog(iss, sub, logName, podDb);

    if (permissions.read) {
      const dbEntries = fromId
        ? getEntriesAfterId(fromId)
        : fromCommit
        ? getEntriesAfterCommit(fromCommit)
        : commaSeperatedCommits
        ? getEntriesByCommits(commaSeperatedCommits)
        : getEntriesAfterId(0);

      if (dbEntries) {
        const entries = dbEntries.map(mapper).map((entry) => ({
          ...entry,
          data:
            entry.type === "file"
              ? `/logs/${logName}/files/${entry.data}`
              : entry.data,
        }));
        return { ok: true, value: { entries } };
      } else {
        return { ok: true, value: { entries: [] } };
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
