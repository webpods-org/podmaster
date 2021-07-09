import * as config from "../../config";
import * as db from "../../db";
import { extname, join } from "path";
import { Files } from "formidable";
import { createHash } from "crypto";
import { ErrResult, Result } from "../../types/api";
import { EntriesRow } from "../../types/db";
import ensurePod from "../pod/ensurePod";
import { getPermissionsForLog } from "./checkPermissionsForLog";
import { ACCESS_DENIED, INVALID_FILENAME } from "../../errors/codes";
import mv = require("mv");
import random from "../../utils/random";
import { promisify } from "util";
import { existsSync, readFileSync } from "fs";
import isFilenameValid from "../../lib/validation/checkFilename";
import { generateInsertStatement } from "../../lib/sqlite";

const moveFile = promisify(mv);

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

    // Let's see if the log already exists.
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);

    const permissions = await getPermissionsForLog(pod, iss, sub, log, podDb);

    if (permissions.admin || permissions.write) {
      // First move the files into the the log directory.
      const movedFiles: {
        [key: string]: {
          filename: string;
          newPath: string;
          hash: string;
        };
      } = {};

      if (files) {
        for (const field in files) {
          const fileOrFiles = files[field];

          /*
            Move the file...
            First, we'll try to use the incoming file name.
            But have to check if it already exists.
          */
          const file = Array.isArray(fileOrFiles)
            ? fileOrFiles[0]
            : fileOrFiles;

          if (file.name && !isFilenameValid(file.name)) {
            const fileError: ErrResult = {
              ok: false,
              code: INVALID_FILENAME,
              error: "Invalid filename.",
            };
            return fileError;
          }

          function getRandomFilePath() {
            const extension = file.name ? extname(file.name) : undefined;
            const randomFilename = random(12);
            const newFilename = extension
              ? `${randomFilename}${extension}`
              : randomFilename;

            return join(
              appConfig.storage.dataDir,
              pod.dataDir,
              log,
              newFilename
            );
          }

          function getFilePathBasedOnOriginalName(filename: string) {
            const preferredFilePath = join(
              appConfig.storage.dataDir,
              pod.dataDir,
              log,
              filename
            );

            return !existsSync(preferredFilePath)
              ? preferredFilePath
              : getRandomFilePath();
          }

          const newPath = file.name
            ? getFilePathBasedOnOriginalName(file.name)
            : getRandomFilePath();

          await moveFile(file.path, newPath);

          const fileBuffer = readFileSync(newPath);
          const hashSum = createHash("sha256");
          hashSum.update(fileBuffer);
          const hash = hashSum.digest("hex");

          movedFiles[file.path] = {
            filename: file.name || random(12),
            newPath,
            hash,
          };
        }
      }

      const insertEntriesTx = podDb.transaction(function insertEntries(
        entries: LogEntry[] | undefined,
        files: Files | undefined
      ) {
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

        if (entries) {
          for (const entry of entries) {
            const contentHash = createHash("sha256")
              .update(entry.data)
              .digest("hex");

            const lastCommitAndContentHash = `${lastCommit};${contentHash}`;

            const newCommit = createHash("sha256")
              .update(lastCommitAndContentHash)
              .digest("hex");

            const entriesRow: Omit<EntriesRow, "id"> = {
              content_hash: contentHash,
              commit: newCommit,
              previous_commit: lastCommit,
              log,
              data: entry.data,
              type: "data",
              created_at: Date.now(),
              iss,
              sub,
            };

            const insertEntryStmt = podDb.prepare(
              generateInsertStatement("entries", entriesRow)
            );

            insertEntryStmt.run(entriesRow);

            savedEntryIds.push({
              id: lastId + 1,
              commit: newCommit,
            });

            lastId++;
            lastCommit = newCommit;
          }
        }

        if (files) {
          for (const field in files) {
            const fileOrFiles = files[field];

            // Move the file...
            const file = Array.isArray(fileOrFiles)
              ? fileOrFiles[0]
              : fileOrFiles;

            const movedFile = movedFiles[file.path];

            const lastCommitAndContentHash = `${lastCommit};${movedFile.hash}`;

            const newCommit = createHash("sha256")
              .update(lastCommitAndContentHash)
              .digest("hex");

            const entryRow: Omit<EntriesRow, "id"> = {
              commit: newCommit,
              content_hash: movedFile.hash,
              log,
              data: movedFile.newPath,
              type: "file",
              previous_commit: lastCommit,
              created_at: Date.now(),
              iss,
              sub,
            };

            const insertEntryStmt = podDb.prepare(
              generateInsertStatement("entries", entryRow)
            );

            insertEntryStmt.run(entryRow);

            savedEntryIds.push({
              id: lastId + 1,
              commit: newCommit,
            });

            lastId++;
            lastCommit = newCommit;
          }
        }
      });

      insertEntriesTx.immediate(entries, files);

      return {
        ok: true,
        value: { entries: savedEntryIds },
      };
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
