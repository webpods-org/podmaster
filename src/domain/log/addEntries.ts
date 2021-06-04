import * as config from "../../config";
import * as db from "../../db";
import { join } from "path";
import random from "../../utils/random";
import { Files } from "formidable";
import { createHash } from "crypto";
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";
import { EntriesRow } from "../../types/db";

export type AddEntriesResult = {
  entries: {
    id: number;
    commit: string;
  }[];
};

export type LogEntry = {
  data: string;
  encoding?: "utf-8";
  previousCommit?: string;
};

export default async function addEntries(
  iss: string,
  sub: string,
  hostname: string,
  log: string,
  entries: LogEntry[] | undefined,
  files: Files | undefined
): Promise<Result<AddEntriesResult>> {
  const appConfig = config.get();

  return ensurePod(hostname, async (pod) => {
    const savedEntryIds: {
      id: number;
      commit: string;
    }[] = [];

    if (entries) {
      // Let's see if the log already exists.
      const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
      const podDb = db.getPodDb(podDataDir);

      const insertEntriesTx = podDb.transaction((entries: LogEntry[]) => {
        // Get the last item
        const lastItemStmt = podDb.prepare(
          `SELECT "id", "commit" FROM "entries" ORDER BY id DESC LIMIT 1`
        );

        let { id: lastId, commit: lastCommit } = (lastItemStmt.get() as
          | EntriesRow
          | undefined) || {
          id: 0,
          commit: "",
        };

        for (const entry of entries) {
          const commitAndData = `${lastCommit};${entry.data}`;

          const newCommit = createHash("sha256")
            .update(commitAndData)
            .digest("hex");

          const insertLogStmt = podDb.prepare(
            `INSERT INTO "entries" ("commit", "previous_commit", "log", "data", "created_at") VALUES (@commit, @previous_commit, @log, @data, @created_at)`
          );

          insertLogStmt.run({
            commit: newCommit,
            log,
            data: entry.data,
            previous_commit: lastCommit,
            created_at: Date.now(),
          });

          savedEntryIds.push({
            id: lastId + 1,
            commit: newCommit,
          });

          lastId++;
          lastCommit = newCommit;
        }
      });

      insertEntriesTx.immediate(entries);

      return {
        ok: true,
        entries: savedEntryIds,
      };
    } else {
      return {
        ok: true,
        entries: [],
      };
    }
  });
}

function generateLogId() {
  return random(8);
}
