import * as config from "../../config";
import * as db from "../../db";
import mapper from "../../mappers/pod";
import { DomainResult as DomainResult } from "../../types/api";
import { MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import mkdirp = require("mkdirp");
import { getPodByHostname } from "../pod/getPodByHostname";
import { Files } from "formidable";
import { createHash } from "crypto";

export type AddEntriesResult = {
  entries: {
    id: number;
    commitId: string;
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
): Promise<DomainResult<AddEntriesResult>> {
  const appConfig = config.get();

  const pod = await getPodByHostname(issuer, subject, hostname);

  const savedEntryIds: {
    id: number;
    commitId: string;
  }[] = [];

  if (pod) {
    if (entries) {
      // Let's see if the log already exists.
      const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
      const podDb = db.getPodDb(podDataDir);

      const insertEntriesTx = podDb.transaction((entries: LogEntry[]) => {
        // Get the last item
        const lastItemStmt = podDb.prepare(
          "SELECT id, commit_id FROM entries ORDER BY id DESC LIMIT 1"
        );

        let { id: lastId, commit_id: lastCommitId } = lastItemStmt.get() || {
          id: 0,
          lastCommitId: "",
        };

        for (const entry of entries) {
          const commitIdAndData = `${lastCommitId};${entry.data}`;

          const newCommitId = createHash("sha256")
            .update(commitIdAndData)
            .digest("base64");

          const insertLogStmt = podDb.prepare(
            "INSERT INTO entries (commit_id, log, data, created_at) VALUES (@commit_id, @log, @data, @created_at)"
          );

          insertLogStmt.run({
            commit_id: newCommitId,
            log,
            data: entry.data,
            created_at: Date.now(),
          });

          savedEntryIds.push({
            id: lastId + 1,
            commitId: newCommitId,
          });

          lastId++;
          lastCommitId = newCommitId;
        }
      });

      insertEntriesTx.immediate(entries);

      return {
        success: true,
        entries: savedEntryIds,
      };
    } else {
      return {
        success: true,
        entries: [],
      };
    }
  } else {
    return {
      success: false,
      code: MISSING_POD,
      error: "Pod not found.",
    };
  }
}

function generateLogId() {
  return random(8);
}
