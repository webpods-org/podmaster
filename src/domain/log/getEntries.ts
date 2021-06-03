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

    const dbEntries = (() => {
      if (fromId) {
        const getEntriesStmt = podDb.prepare(
          "SELECT id, commit, data FROM entries WHERE id > @id LIMIT @count"
        );

        return getEntriesStmt.all({
          id: fromId,
          count: count || 100,
        }) as EntriesRow[];
      } else if (fromCommit) {
        const getCommitStmt = podDb.prepare(
          "SELECT id FROM entries WHERE commit = @commit"
        );

        const commitRow: EntriesRow = getCommitStmt.get({ commit: fromCommit });

        if (commitRow) {
          const id = commitRow.id;

          const getEntriesStmt = podDb.prepare(
            "SELECT id, commit, data FROM entries WHERE id > @id LIMIT @count"
          );

          return getEntriesStmt.all({
            id: fromId,
            count: count || 100,
          }) as EntriesRow[];
        } else {
          return [] as EntriesRow[];
        }
      } else if (commaSeperatedCommits) {
        const commitList = commaSeperatedCommits
          .split(",")
          .map((x) => x.trim());

        const commitRows: EntriesRow[] = [];

        for (const commit of commitList) {
          const getSingleCommitStmt = podDb.prepare(
            "SELECT id, commit, data FROM entries WHERE commit > @commit"
          );

          const commitRow = getSingleCommitStmt.get({ commit });

          if (commitRow) {
            commitRows.push(commitRow);
          }
        }

        return commitRows;
      }
    })();

    if (dbEntries) {
      const entries = dbEntries.map(mapper);
      return { ok: true, entries };
    } else {
      return { ok: true, entries: [] };
    }
  });
}
