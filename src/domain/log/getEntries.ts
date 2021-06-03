import * as config from "../../config";
import * as db from "../../db";
import { join } from "path";
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";
import { EntriesRow } from "../../types/db";
import mapper from "../../mappers/entry";
import { LogEntry } from "../../types/types";

export type GetEntriesResult = {
  entries: LogEntry[];
};

export default async function getEntries(
  issuer: string,
  subject: string,
  hostname: string,
  log: string,
  fromId?: number,
  fromCommit?: string,
  commaSeperatedCommits?: string,
  count?: number
): Promise<Result<GetEntriesResult>> {
  const appConfig = config.get();

  return ensurePod(issuer, subject, hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);

    function getEntriesAfterId(id: number) {
      const getEntriesStmt = podDb.prepare(
        "SELECT id, commit_id, data FROM entries WHERE log = @log AND id > @id LIMIT @count"
      );

      return getEntriesStmt.all({
        id: fromId,
        log,
        count: count || 100,
      }) as EntriesRow[];
    }

    function getEntriesAfterCommit(commit: string) {
      const getCommitStmt = podDb.prepare(
        "SELECT id FROM entries WHERE log = @log AND commit_id = @commit_id"
      );

      const commitRow: EntriesRow = getCommitStmt.get({
        log,
        commit_id: fromCommit,
      });

      if (commitRow) {
        const id = commitRow.id;

        const getEntriesStmt = podDb.prepare(
          "SELECT id, commit_id, data FROM entries WHERE log = @log AND id > @id LIMIT @count"
        );

        return getEntriesStmt.all({
          id: fromId,
          log,
          count: count || 100,
        }) as EntriesRow[];
      } else {
        return [] as EntriesRow[];
      }
    }

    function getEntriesByCommit(commaSeperatedCommits: string) {
      const commitList = commaSeperatedCommits.split(",").map((x) => x.trim());

      const commitRows: EntriesRow[] = [];

      for (const commit of commitList) {
        const getSingleCommitStmt = podDb.prepare(
          "SELECT id, commit_id, data FROM entries WHERE log = @log AND commit_id = @commit_id"
        );

        const commitRow = getSingleCommitStmt.get({ log, commit_id: commit });

        if (commitRow) {
          commitRows.push(commitRow);
        }
      }

      return commitRows;
    }

    const dbEntries = fromId
      ? getEntriesAfterId(fromId)
      : fromCommit
      ? getEntriesAfterCommit(fromCommit)
      : commaSeperatedCommits
      ? getEntriesByCommit(commaSeperatedCommits)
      : getEntriesAfterId(0);

    if (dbEntries) {
      const entries = dbEntries.map(mapper);
      return { ok: true, entries };
    } else {
      return { ok: true, entries: [] };
    }
  });
}
