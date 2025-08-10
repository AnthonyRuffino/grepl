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


Relative Path Handling:
Uses relative path 'node_modules/grepl/README.md' directly.
```sh
node -e "import('grepl').then(async m => { const r = await m.rungrepl({ query: 'PATH', target: 'node_modules/grepl/README.md', fixedStrings: true }); console.log(r.stdout); })"
```

Absolute Path Handling:
Uses path.resolve(process.cwd(), 'node_modules/grepl/README.md') to create an absolute path
```sh
node -e "(async()=>{ const p=await import('node:path'); const m=await import('grepl'); const file=p.resolve(process.cwd(),'node_modules/grepl/README.md'); const r=await m.rungrepl({ query:'PATH', target:file, fixedStrings:true }); console.log(r.stdout, file); })()"
```

Output:
Relative: Only prints the search results (r.stdout)
Absolute: Prints both results AND the full file path (r.stdout, file)


Example output:

Relative Path:

Command:
```
node -e "import('grepl').then(async m => { const r = await m.rungrepl({ query: 'PATH', target: 'node_modules/grepl/README.md', matchCase: true, fixedStrings: true }); console.log(r.stdout); })"
```

Response:
```
/tmp/grepl-test/node_modules/grepl/README.md:13:> Requires Node 18+. By default the wrapper prefers its bundled `grepl.sh` (shipped in this package). If not present, it falls back to `grepl` on PATH. You can override with `grepl_CMD=/path/to/grepl` or the `greplCmd` option.
--
/tmp/grepl-test/node_modules/grepl/README.md:38:node -e "(async()=>{ const p=await import('node:path'); const m=await import('grepl'); const file=p.resolve(process.cwd(),'node_modules/grepl/README.md'); const r=await m.rungrepl({ query:'PATH', target:file, fixedStrings:true }); console.log(r.stdout, file); })()"
--
/tmp/grepl-test/node_modules/grepl/README.md:44:/tmp/grepl-test/node_modules/grepl/README.md:13:> Requires Node 18+. By default the wrapper prefers its bundled `grepl.sh` (shipped in this package). If not present, it falls back to `grepl` on PATH. You can override with `grepl_CMD=/path/to/grepl` or the `greplCmd` option.
```

Absolute Path:

Command:
```
node -e "(async()=>{ const p=await import('node:path'); const m=await import('grepl'); const file=p.resolve(process.cwd(),'node_modules/grepl/README.md'); const r=await m.rungrepl({ query:'PATH', target:file, matchCase:true, fixedStrings:true }); console.log(r.stdout, file); })()"
```

Response:
```
/tmp/grepl-test/node_modules/grepl/README.md:13:> Requires Node 18+. By default the wrapper prefers its bundled `grepl.sh` (shipped in this package). If not present, it falls back to `grepl` on PATH. You can override with `grepl_CMD=/path/to/grepl` or the `greplCmd` option.
--
/tmp/grepl-test/node_modules/grepl/README.md:38:node -e "(async()=>{ const p=await import('node:path'); const m=await import('grepl'); const file=p.resolve(process.cwd(),'node_modules/grepl/README.md'); const r=await m.rungrepl({ query:'PATH', target:file, fixedStrings:true }); console.log(r.stdout, file); })()"
--
/tmp/grepl-test/node_modules/grepl/README.md:44:/tmp/grepl-test/node_modules/grepl/README.md:13:> Requires Node 18+. By default the wrapper prefers its bundled `grepl.sh` (shipped in this package). If not present, it falls back to `grepl` on PATH. You can override with `grepl_CMD=/path/to/grepl` or the `greplCmd` option.
 /tmp/grepl-test/node_modules/grepl/README.md
```

### Environment setup used above

```sh
rm -rf /tmp/grepl-test && mkdir -p /tmp/grepl-test && cd /tmp/grepl-test
npm init -y
npm i /home/anthony-ruffino/git/github.com/AnthonyRuffino/grepl/grepl-0.1.0.tgz
```


### Installing the cli (optional)

- Install using the bundled script from `node_modules` (no network). The programmatic `install()` copies the included `grepl.sh` to a destination and marks it executable. By default, it writes to `~/.local/bin/grepl` and prompts before overwrite.

If you do not want to install grepl directly, you can use the bash script bundled with the npm packacge with the following usage:

```sh
/node_modules/grepl/grepl.sh -c PATH  node_modules/grepl/README.md
```

To install as executable bash script `~/.local/bin/grepl`
```sh
node -e "import('grepl').then(m => m.install())"
```

When you need control:
```sh
node -e "(async()=>{ const m=await import('grepl'); await m.install(); })()"
```

### Options → grepl flags
Usage: ./node_modules/grepl/grepl.sh [options] <search_string> <file_or_directory>
- before → -B
- after → -A
- recursive → -R
- wholeWord → -w
- matchCase → -c
- fixedStrings → -F
- greplCmd → custom path/command for grepl
- suppressErrors → return stdout/stderr even if exit code ≠ 0

Usage: grepl [options] <search_string> <file_or_directory>
e.g.
```sh
grepl -c PATH  /tmp/grepl-test/node_modules/grepl/README.md
```

