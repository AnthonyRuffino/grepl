import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

// If grepl isn't on PATH, let callers override via env or option
const DEFAULT_grepl_CMD = process.env.grepl_CMD || "grepl";

/**
 * Build CLI args for grepl from options.
 * Mirrors: -B (before), -A (after), -R, -w, -c, -F
 */
function buildArgs(opts) {
  const {
    query,
    target = ".",
    before,
    after,
    recursive,
    wholeWord,
    matchCase,
    fixedStrings
  } = opts;

  if (!query || typeof query !== "string" || !query.trim()) {
    throw new Error("query is required and must be a non-empty string");
  }

  const cliArgs = [];
  if (Number.isInteger(before) && before >= 0) cliArgs.push("-B", String(before));
  if (Number.isInteger(after)  && after  >= 0) cliArgs.push("-A", String(after));
  if (recursive)    cliArgs.push("-R");
  if (wholeWord)    cliArgs.push("-w");
  if (matchCase)    cliArgs.push("-c");
  if (fixedStrings) cliArgs.push("-F");

  // Important: execFile separates args safely (no shell interpolation).
  cliArgs.push(query, path.resolve(process.cwd(), target));
  return cliArgs;
}

/**
 * Run grepl and get stdout/stderr. Throws on non-zero exit unless `suppressErrors` is true.
 *
 * @param {Object} opts
 * @param {string} [opts.greplCmd] path or command name for grepl
 * @param {string} opts.query       search string
 * @param {string} [opts.target="."] file or directory path
 * @param {number} [opts.before]    -B
 * @param {number} [opts.after]     -A
 * @param {boolean} [opts.recursive] -R
 * @param {boolean} [opts.wholeWord] -w
 * @param {boolean} [opts.matchCase] -c
 * @param {boolean} [opts.fixedStrings] -F
 * @param {boolean} [opts.suppressErrors=false] if true, return stdout/stderr even on failure
 * @returns {Promise<{ stdout: string, stderr: string }>}
 */
export async function rungrepl(opts) {
  const greplCmd = opts?.greplCmd || DEFAULT_grepl_CMD;
  const args = buildArgs(opts);

  try {
    const { stdout, stderr } = await execFileAsync(greplCmd, args, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024
    });
    return { stdout: stdout ?? "", stderr: stderr ?? "" };
  } catch (err) {
    if (opts?.suppressErrors) {
      const stdout = err?.stdout ?? "";
      const stderr = (err?.stderr ?? "") || String(err?.message ?? err);
      return { stdout, stderr };
    }
    // Re-throw with both streams included for easier debugging upstream
    const enriched = new Error(
      [
        `grepl failed: ${err?.message ?? err}`,
        err?.stdout ? `\nSTDOUT:\n${err.stdout}` : "",
        err?.stderr ? `\nSTDERR:\n${err.stderr}` : ""
      ].join("")
    );
    enriched.code = err?.code;
    enriched.stdout = err?.stdout;
    enriched.stderr = err?.stderr;
    throw enriched;
  }
}

/**
 * Call grepl with no args to print usage/help.
 * @param {Object} [opts]
 * @param {string} [opts.greplCmd]
 */
export async function greplHelp(opts = {}) {
  const greplCmd = opts.greplCmd || DEFAULT_grepl_CMD;
  try {
    const { stdout, stderr } = await execFileAsync(greplCmd, [], {
      cwd: process.cwd(),
      maxBuffer: 2 * 1024 * 1024
    });
    return { stdout: stdout ?? "", stderr: stderr ?? "" };
  } catch (err) {
    // many CLIs return non-zero on --help/usage; surface whatever came out
    return {
      stdout: err?.stdout ?? "",
      stderr: (err?.stderr ?? "") || String(err?.message ?? err)
    };
  }
}

export { buildArgs };


