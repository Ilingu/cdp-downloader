import commandLineArgs from "command-line-args";
import "colors";

const optionDefinitions: Parameters<typeof commandLineArgs>[0] = [
  {
    name: "school_id",
    type: String,
    defaultValue: "mp2i-parc",
  },
  {
    name: "input_dir",
    type: String,
    alias: "i",
  },
  {
    name: "username",
    type: String,
    alias: "u",
    defaultValue: "",
  },
  {
    name: "password",
    type: String,
    alias: "p",
    defaultValue: "",
  },
  {
    name: "output",
    type: String,
    alias: "o",
  },
  { name: "verbose", alias: "v", type: Boolean, defaultValue: false },
];

type ReturnType = {
  school_id: string;
  input_dir: string;
  username: string;
  password: string;
  output: string;
};

/// might throw an error if args are not valid
export default function parseArgs(): ReturnType {
  const args = commandLineArgs(optionDefinitions);

  if (
    !("school_id" in args) ||
    !("input_dir" in args) ||
    !("output" in args) ||
    !("username" in args) ||
    !("password" in args) ||
    !("verbose" in args)
  )
    throw console.error("[FATAL] not enough option were provided".red.bold);

  const { school_id, verbose, input_dir, output, username, password } = args;
  if (
    typeof school_id !== "string" ||
    typeof input_dir !== "string" ||
    typeof output !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof verbose !== "boolean"
  )
    throw console.error("[FATAL] options types are invalid".red.bold);

  process.env.VERBOSE = `${verbose}`; // set verbose env
  return { school_id, input_dir, output, username, password };
}
