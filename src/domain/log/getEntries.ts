import * as db from "../../db/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { EntriesRow } from "../../types/db.js";
import mapper from "../../mappers/entry.js";
import { JwtClaims, LogEntry } from "../../types/types.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPermissionsForLog } from "./getPermissionsForLog.js";
import { getPodDataDir } from "../../storage/index.js";

export type GetEntriesResult = {
  entries: LogEntry[];
};

export type GetEntriesOptions = {
  from?: number;
  last?: number;
  sinceId?: number;
  sinceCommit?: string;
  commits?: string;
  limit?: number;
};

export default async function getEntries(
  hostname: string,
  logId: string,
  {
    from,
    last,
    sinceId,
    sinceCommit,
    commits: commitIds,
    limit: maxResults,
  }: GetEntriesOptions,
  userClaims: JwtClaims | undefined
): Promise<Result<GetEntriesResult>> {
  const limit = maxResults || 100;

  return ensurePod(hostname, async (pod) => {
    function getEntriesFrom(offset: number, ascending: boolean) {
      const getEntriesStmt = podDb.prepare(
        ascending
          ? `SELECT * FROM "entries" WHERE "log_id" = @log_id LIMIT @limit OFFSET @offset`
          : `SELECT * FROM "entries" WHERE "log_id" = @log_id ORDER BY ROWID DESC LIMIT @limit OFFSET @offset`
      );

      return getEntriesStmt.all({
        log_id: logId,
        limit,
        offset,
      }) as EntriesRow[];
    }

    function getEntriesFromId(id: number) {
      const getEntriesStmt = podDb.prepare(
        `SELECT * FROM "entries" WHERE "log_id" = @log_id AND "id" > @id LIMIT @limit`
      );

      return getEntriesStmt.all({
        id,
        log_id: logId,
        limit,
      }) as EntriesRow[];
    }

    function getEntriesAfterCommit(commit: string) {
      const getCommitStmt = podDb.prepare(
        `SELECT "id" FROM "entries" WHERE "log_id" = @log_id AND "commit" = @commit`
      );

      const commitRow: EntriesRow = getCommitStmt.get({
        log_id: logId,
        commit,
      });

      if (commitRow) {
        return getEntriesFromId(commitRow.id);
      } else {
        return [] as EntriesRow[];
      }
    }

    function getEntriesByCommits(commaSeperatedCommits: string) {
      const commitList = commaSeperatedCommits.split(",").map((x) => x.trim());

      const commitRows: EntriesRow[] = [];

      for (const commit of commitList) {
        const getSingleCommitStmt = podDb.prepare(
          `SELECT * FROM "entries" WHERE "log_id" = @log_id AND "commit" = @commit`
        );

        const commitRow = getSingleCommitStmt.get({
          log_id: logId,
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
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const permissions = await getPermissionsForLog(
      hostname,
      logId,
      podDb,
      userClaims
    );

    if (permissions.read) {
      const dbEntries = sinceId
        ? getEntriesFromId(sinceId)
        : sinceCommit
        ? getEntriesAfterCommit(sinceCommit)
        : commitIds
        ? getEntriesByCommits(commitIds)
        : from
        ? getEntriesFrom(from, true)
        : last
        ? getEntriesFrom(last, false)
        : getEntriesFromId(0);

      if (dbEntries) {
        const entries = dbEntries.map(mapper).map((entry) => ({
          ...entry,
          data:
            entry.type === "file"
              ? `/logs/${logId}/files/${entry.data}`
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
