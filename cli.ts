import commandLineArgs from "command-line-args";
import "colors";

const optionDefinitions: Parameters<typeof commandLineArgs>[0] = [
  {
    name: "school_id",
    type: String,
    defaultValue: "mp2i-parc",
  },
  {
    name: "session_perm",
    type: String,
    defaultValue: process.env.CDP_SESSION_PERM,
  },
  {
    name: "input_dir",
    type: String,
    alias: "i",
  },
  {
    name: "output",
    type: String,
    alias: "o",
  },
  {
    name: "session",
    type: String,
    defaultValue: process.env.CDP_SESSION,
  },
  { name: "verbose", alias: "v", type: Boolean, defaultValue: false },
];

type ReturnType = {
  school_id: string;
  input_dir: string;
  output: string;
};

/// might throw an error if args are not valid
export default function parseArgs(): ReturnType {
  const args = commandLineArgs(optionDefinitions);

  if (
    !("school_id" in args) ||
    !("input_dir" in args) ||
    !("output" in args) ||
    !("session_perm" in args) ||
    !("session" in args) ||
    !("verbose" in args)
  )
    throw console.error("[FATAL] not enough option were provided".red.bold);

  const { school_id, session_perm, session, verbose, input_dir, output } = args;
  if (
    typeof school_id !== "string" ||
    typeof session_perm !== "string" ||
    typeof input_dir !== "string" ||
    typeof output !== "string" ||
    typeof session !== "string" ||
    typeof verbose !== "boolean"
  )
    throw console.error("[FATAL] options types are invalid".red.bold);

  process.env.VERBOSE = `${verbose}`; // set verbose env
  // set credential env
  process.env.CDP_SESSION_PERM = session_perm;
  process.env.CDP_SESSION = session;

  return { school_id, input_dir, output };
}
