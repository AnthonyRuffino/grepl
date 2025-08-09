# grepl

Small Node.js wrapper around the `grepl` CLI for programmatic use (e.g. MCP servers).

## Install

```bash
npm i grepl
# or
pnpm add grepl
```

> Requires Node 18+. By default the wrapper prefers its bundled `grepl.sh` (shipped in this package). If not present, it falls back to `grepl` on PATH. You can override with `grepl_CMD=/path/to/grepl` or the `greplCmd` option.

## Usage

```js
import { rungrepl, greplHelp } from "grepl";

const { stdout } = await rungrepl({
  query: "TODO",
  target: ".",
  before: 1,
  after: 1,
  recursive: true,
  fixedStrings: true
});
console.log(stdout);

// Usage text
const help = await greplHelp();
console.log(help.stdout || help.stderr);
```

### Quick local test against the bundled README

```sh
node -e "(async()=>{ const p=await import('node:path'); const m=await import('grepl'); const file=p.resolve(process.cwd(),'node_modules/grepl/README.md'); const r=await m.rungrepl({ query:'PATH', target:file, fixedStrings:true }); console.log(r.stdout, file); })()"
```

Example output:

```
/tmp/grepl-test/node_modules/grepl/README.md:13:> Requires Node 18+. By default the wrapper prefers its bundled `grepl.sh` (shipped in this package). If not present, it falls back to `grepl` on PATH. You can override with `grepl_CMD=/path/to/grepl` or the `greplCmd` option.
--
/tmp/grepl-test/node_modules/grepl/README.md:43:- greplCmd → custom path/command for grepl
 /tmp/grepl-test/node_modules/grepl/README.md
```

### Environment setup used above

```sh
rm -rf /tmp/grepl-test && mkdir -p /tmp/grepl-test && cd /tmp/grepl-test
npm init -y
npm i /home/anthony-ruffino/git/github.com/AnthonyRuffino/grepl/grepl-0.1.0.tgz
```

### Install options

- Install the grepl CLI from GitHub (default URL pattern). Writes to `~/.local/bin` by default and makes it executable.

```js
import { install } from "grepl";

// Default (uses the package’s preferred tag/URL)
await install();

// Specific tag
await install({ version: "v0.0.1" });

// Explicit URL
await install({ url: "https://raw.githubusercontent.com/AnthonyRuffino/grepl/refs/tags/v0.0.1/grepl.sh" });

// System-wide (requires sudo)
// await install({ destDir: "/usr/local/bin", force: true });
```

- Install using the bundled script from `node_modules` (no network). This copies the included `grepl.sh` to a destination and marks it executable.

```sh
node -e "(async()=>{ const fs=await import('node:fs'); const p=await import('node:path'); const targetDir=p.resolve(process.env.HOME,'/.local/bin'); await fs.promises.mkdir(targetDir,{recursive:true}); const src=p.resolve(require.resolve('grepl'),'..','..','grepl.sh'); const dst=p.resolve(targetDir,'grepl'); await fs.promises.copyFile(src,dst); await fs.promises.chmod(dst,0o755); console.log('Installed to',dst); })()"
```

## Options → grepl flags

- before → -B
- after → -A
- recursive → -R
- wholeWord → -w
- matchCase → -c
- fixedStrings → -F
- greplCmd → custom path/command for grepl
- suppressErrors → return stdout/stderr even if exit code ≠ 0

