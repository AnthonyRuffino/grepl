import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import readline from "node:readline";

const execFileAsync = promisify(execFile);

// Prefer bundled grepl.sh if present in the package tarball, else fall back to env or PATH
function resolveDefaultGreplCmd() {
  const envOverride = process.env.grepl_CMD;
  if (envOverride && envOverride.trim()) return envOverride;
  const candidateInPkg = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "grepl.sh");
  try {
    // On some systems URL pathname is percent-encoded; decode it
    const decoded = decodeURIComponent(candidateInPkg);
    if (fs.existsSync(decoded)) {
      return decoded;
    }
  } catch {}
  return "grepl";
}

const DEFAULT_grepl_CMD = resolveDefaultGreplCmd();

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

// -----------------------------
// Installer for grepl CLI (bundled copy only)
// -----------------------------

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.FOK ?? fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function promptYesNo(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question} `, (answer) => {
      rl.close();
      const normalized = String(answer || "").trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

/**
 * Install the bundled grepl CLI script locally.
 * - Copies this package's bundled grepl.sh
 * - Writes to destDir/fileName (default $HOME/.local/bin/grepl)
 * - Prompts before overwrite unless force=true
 * - chmod +x on the installed file
 *
 * @param {Object} [opts]
 * @param {string} [opts.destDir] Destination directory (default $HOME/.local/bin)
 * @param {string} [opts.fileName="grepl"] Installed filename
 * @param {boolean} [opts.force=false] Overwrite without prompting
 * @param {boolean} [opts.nonInteractive=false] If true and overwrite needed without force, throw instead of prompting
 * @returns {Promise<{ installed: boolean, path: string, skipped?: boolean, reason?: string }>} Install result
 */
export async function install(opts = {}) {
  const defaultUserBin = path.join(os.homedir(), ".local", "bin");
  const destDir = opts.destDir || defaultUserBin;
  const fileName = opts.fileName || "grepl";
  const force = Boolean(opts.force);
  const nonInteractive = Boolean(opts.nonInteractive);

  const destinationPath = path.resolve(destDir, fileName);
  const bundledCandidate = decodeURIComponent(path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "grepl.sh"));

  if (!(await fileExists(bundledCandidate))) {
    const err = new Error("Bundled grepl.sh not found in this package. Cannot install.");
    err.code = "ENOENT";
    throw err;
  }

  try {
    await fs.promises.mkdir(destDir, { recursive: true });
  } catch (err) {
    // proceed; write will surface a clearer error
  }

  if (await fileExists(destinationPath) && !force) {
    if (nonInteractive) {
      const error = new Error(`Destination exists: ${destinationPath}. Set force=true to overwrite.`);
      error.code = "EEXIST";
      throw error;
    }
    const approved = await promptYesNo(`File exists at ${destinationPath}. Overwrite? [y/N]`);
    if (!approved) {
      return { installed: false, skipped: true, reason: "user_declined", path: destinationPath };
    }
  }

  try {
    await fs.promises.copyFile(bundledCandidate, destinationPath);
    await fs.promises.chmod(destinationPath, 0o755);
  } catch (err) {
    if (err && (err.code === "EACCES" || err.code === "EPERM")) {
      const guidance = [
        `Permission denied writing to ${destDir}.`,
        `Try one of the following:`,
        `- Use a user-writable directory (default): ${defaultUserBin} and ensure it's on PATH`,
        `- Or re-run with elevated permissions for system dirs (e.g. /usr/local/bin)`
      ].join("\n");
      const wrapped = new Error(guidance);
      wrapped.code = err.code;
      wrapped.cause = err;
      throw wrapped;
    }
    throw err;
  }

  console.log(`✅ grepl installed successfully to: ${destinationPath}`);
  return { installed: true, path: destinationPath };
}


