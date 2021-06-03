import * as config from "../../config";
import * as db from "../../db";
import { MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import { getPodByHostname } from "../pod/getPodByHostname";
import { Files } from "formidable";
import { createHash } from "crypto";
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";

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
  issuer: string,
  subject: string,
  hostname: string,
  log: string,
  entries: LogEntry[] | undefined,
  files: Files | undefined
): Promise<Result<AddEntriesResult>> {
  const appConfig = config.get();

  return ensurePod(issuer, subject, hostname, async (pod) => {
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
          "SELECT id, commit FROM entries ORDER BY id DESC LIMIT 1"
        );

        let { id: lastId, commit: lastCommitId } = lastItemStmt.get() || {
          id: 0,
          lastCommitId: "",
        };

        for (const entry of entries) {
          const commitAndData = `${lastCommitId};${entry.data}`;

          const newCommitId = createHash("sha256")
            .update(commitAndData)
            .digest("base64");

          const insertLogStmt = podDb.prepare(
            "INSERT INTO entries (commit, log, data, created_at) VALUES (@commit, @log, @data, @created_at)"
          );

          insertLogStmt.run({
            commit: newCommitId,
            log,
            data: entry.data,
            created_at: Date.now(),
          });

          savedEntryIds.push({
            id: lastId + 1,
            commit: newCommitId,
          });

          lastId++;
          lastCommitId = newCommitId;
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
