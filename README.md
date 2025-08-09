# grepl

Small Node.js wrapper around the `grepl` CLI for programmatic use (e.g. MCP servers).

## Install

```bash
npm i grepl
# or
pnpm add grepl
```

> Requires Node 18+. Assumes `grepl` is on PATH. Override with `grepl_CMD=/path/to/grepl` or the `greplCmd` option.

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

## Options → grepl flags

- before → -B
- after → -A
- recursive → -R
- wholeWord → -w
- matchCase → -c
- fixedStrings → -F
- greplCmd → custom path/command for grepl
- suppressErrors → return stdout/stderr even if exit code ≠ 0

