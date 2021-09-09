import { extname, join } from "path";
import { Files } from "formidable";
import { createHash } from "crypto";
import mv from "mv";
import random from "../../../utils/random.js";
import { promisify } from "util";
import { existsSync, readFileSync } from "fs";

import * as db from "../../../db/index.js";
import { ErrResult, Result } from "../../../types/api.js";
import { EntriesRow } from "../../../types/db.js";
import ensurePod from "../../pods/util/ensurePod.js";
import getLogPermissionForJwt from "../util/getLogPermissionForJwt.js";
import { ACCESS_DENIED, INVALID_FILENAME } from "../../../errors/codes.js";
import isFilenameValid from "../../../lib/validation/checkFilename.js";
import { generateInsertStatement } from "../../../lib/sqlite.js";
import { getPodDataDir } from "../../../storage/index.js";
import { JwtClaims } from "../../../types/types.js";

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
  hostname: string,
  log: string,
  entries: LogEntry[] | undefined,
  files: Files | undefined,
  userClaims: JwtClaims
): Promise<Result<AddEntriesResult>> {
  return ensurePod(hostname, async (pod) => {
    function getFilePathBasedOnOriginalName(filename: string) {
      const podDataDir = getPodDataDir(pod.id);
      const preferredFilePath = join(podDataDir, log, filename);

      return !existsSync(preferredFilePath)
        ? preferredFilePath
        : getRandomFilePath(filename);
    }

    function getRandomFilePath(filename: string | null) {
      const extension = filename ? extname(filename) : undefined;
      const randomFilename = random(12);
      const newFilename = extension
        ? `${randomFilename}${extension}`
        : randomFilename;

      const podDataDir = getPodDataDir(pod.id);
      return join(podDataDir, log, newFilename);
    }

    const savedEntryIds: {
      id: number;
      commit: string;
    }[] = [];

    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const logPermission = await getLogPermissionForJwt(
      hostname,
      log,
      podDb,
      userClaims
    );

    if (logPermission.write) {
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

          const newPath = file.name
            ? getFilePathBasedOnOriginalName(file.name)
            : getRandomFilePath(file.name);

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

            const entriesRow = {
              content_hash: contentHash,
              commit: newCommit,
              previous_commit: lastCommit,
              log_id: log,
              data: entry.data,
              type: "data" as "data",
              created_at: Date.now(),
              iss: userClaims.iss,
              sub: userClaims.sub,              
            };

            const insertEntryStmt = podDb.prepare(
              generateInsertStatement<EntriesRow>("entries", entriesRow)
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

            const entryRow = {
              commit: newCommit,
              content_hash: movedFile.hash,
              log_id: log,
              data: movedFile.filename,
              type: "file" as "file",
              previous_commit: lastCommit,
              created_at: Date.now(),
              iss: userClaims.iss,
              sub: userClaims.sub,
            };

            const insertEntryStmt = podDb.prepare(
              generateInsertStatement<EntriesRow>("entries", entryRow)
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