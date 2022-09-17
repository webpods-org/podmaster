import * as db from "../../../db/index.js";
import ensurePod from "../../pods/internal/ensurePod.js";
import { EntriesRow } from "../../../types/db.js";
import mapper from "../../../mappers/entry.js";
import { HttpError, PodJwtClaims, LogEntry } from "../../../types/index.js";
import getLogPermissionForJwt from "../internal/getLogPermissionForJwt.js";
import { getPodDataDir } from "../../../storage/index.js";
import * as config from "../../../config/index.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../../Result.js";

export type GetEntriesResult = {
  entries: LogEntry[];
};

export type GetEntriesOptions = {
  offset?: number;
  order?: string;
  sinceId?: number;
  sinceCommit?: string;
  commits?: string;
  limit?: number;
};

export default async function getEntries(
  hostname: string,
  logId: string,
  {
    offset,
    order,
    sinceId,
    sinceCommit,
    commits: commitIds,
    limit: maxResults,
  }: GetEntriesOptions,
  userClaims: PodJwtClaims | undefined
): Promise<ValidResult<GetEntriesResult> | InvalidResult<HttpError>> {
  const appConfig = config.get();

  const limit = maxResults || appConfig.queries?.maxResults || 100;

  return ensurePod(hostname, async (pod) => {
    function getEntriesFrom(offset: number, ascending: boolean) {
      const getEntriesStmt = podDb.prepare(
        ascending
          ? `SELECT * FROM "log_entry" WHERE "log_id" = @log_id LIMIT @limit OFFSET @offset`
          : `SELECT * FROM "log_entry" WHERE "log_id" = @log_id ORDER BY ROWID DESC LIMIT @limit OFFSET @offset`
      );

      return getEntriesStmt.all({
        log_id: logId,
        limit,
        offset,
      }) as EntriesRow[];
    }

    function getEntriesFromId(id: number) {
      const getEntriesStmt = podDb.prepare(
        `SELECT * FROM "log_entry" WHERE "log_id" = @log_id AND "id" > @id LIMIT @limit`
      );

      return getEntriesStmt.all({
        id,
        log_id: logId,
        limit,
      }) as EntriesRow[];
    }

    function getEntriesAfterCommit(commit: string) {
      const getCommitStmt = podDb.prepare(
        `SELECT "id" FROM "log_entry" WHERE "log_id" = @log_id AND "commit" = @commit`
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
          `SELECT * FROM "log_entry" WHERE "log_id" = @log_id AND "commit" = @commit`
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

    const logPermission = await getLogPermissionForJwt(
      pod.app,
      logId,
      podDb,
      userClaims
    );

    if (!logPermission.read) {
      return new InvalidResult({
        error: "Access denied.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    const dbEntries = sinceId
      ? getEntriesFromId(sinceId)
      : sinceCommit
      ? getEntriesAfterCommit(sinceCommit)
      : commitIds
      ? getEntriesByCommits(commitIds)
      : offset !== undefined
      ? getEntriesFrom(offset, order?.toLowerCase() !== "desc")
      : getEntriesFromId(0);

    if (dbEntries) {
      const entries = dbEntries.map(mapper).map((entry) => ({
        ...entry,
        data:
          entry.type === "file"
            ? `/logs/${logId}/files/${entry.data}`
            : entry.data,
      }));
      const result: GetEntriesResult = { entries };
      return new ValidResult(result);
    } else {
      const result: GetEntriesResult = { entries: [] };
      return new ValidResult(result);
    }
  });
}
