import "colors";
import parseArgs from "./cli";
import {
  indexDocs,
  findInputDirUrl,
  isVerbose,
  downloadDocumentsFiles,
  toSafeSID,
  DocumentTree,
  login,
} from "./core";

const { school_id, input_dir, output, username, password } = parseArgs();
if (isVerbose())
  console.log("Provided args:", {
    school_id,
    input_dir,
    output,
    username,
    password,
    verbose: process.env.VERBOSE,
  });

const [SIDSuccess, safeSID] = toSafeSID(school_id);
if (!SIDSuccess) throw console.error("[FATAL] invalid school id");

const loginSuccess = await login(username, password, safeSID);
if (!loginSuccess) throw console.error("[FATAL] failed to login to cdp");

const [findSuccess, url] = await findInputDirUrl(safeSID, input_dir);
if (!findSuccess)
  throw console.error(
    `[FATAL] Failed to fetch or find the corresponding url of '${input_dir}' in '${school_id}'`
  );

if (isVerbose()) console.log("Indexing the documents...".blue);
const [indexSuccess, docsIndex] = await indexDocs(url);
if (!indexSuccess || docsIndex === null)
  throw console.error(`[FATAL] Failed to index the documents`);
if (isVerbose()) console.log("Documents indexed successfully".green);

if (isVerbose()) console.log("Downloading the documents...".blue);
const [downloadSuccess, files] = await downloadDocumentsFiles(
  docsIndex,
  school_id
);
if (!downloadSuccess || files.length <= 0)
  throw console.error(`[FATAL] Failed to download the documents`);
if (isVerbose())
  console.log(`${files.length} documents downloaded successfully`.green);

const filesTable: { [K in string]: [string, string, Blob] } = {};
for (const file of files) {
  filesTable[file[0]] = file;
}

// -- linking

import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const output_path = resolve(output.trim()).replace(/\/+$/g, "");
const recusiveLinking = async (currDoc: DocumentTree, path: string) => {
  await mkdir(path, { recursive: true });
  for (const fid of currDoc.files) {
    const file = filesTable[fid];
    if (file === undefined) {
      console.warn("[WARN] failed to link a file (data lost)".yellow);
      continue;
    }

    const [_, filename, fileDatas] = file;
    await Bun.write(
      Bun.file(`${path.replace(/\/+$/g, "")}/${filename}`),
      fileDatas
    );
  }

  for (const subDoc of currDoc.subfolders)
    recusiveLinking(
      subDoc,
      `${path.replace(/\/+$/g, "")}/${subDoc.name || randomUUID().slice(0, 10)}`
    );
};
recusiveLinking(docsIndex, output_path);
if (isVerbose())
  console.log(
    `All documents successfully synced into output directory: '${output_path}'`
      .green
  );
