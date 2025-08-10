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


#### Relative Path Handling:
Uses relative path 'node_modules/grepl/README.md' directly.

##### Command:
```sh
$ node -e '
  import("grepl")
    .then(m => 
      m.rungrepl({ query: "m.rungrepl", target: "README.md", fixedStrings: true })
        .then(r => console.log(r.stdout))
    )
'
```
##### Output:
```
README.md:46:      m.rungrepl({ query: "rungrepl", target: "README.md", fixedStrings: true })
README.md:53:...
```

#### Absolute Path Handling:
Uses path.resolve(process.cwd(), 'node_modules/grepl/README.md') to create an absolute path

##### Command:
```sh
$ node -e '
  import("grepl")
    .then(g => 
      import("node:path")
        .then(p => p.resolve(process.cwd(), "README.md"))
        .then(f => 
          g.rungrepl({ query: "g.rungrepl", target: f, fixedStrings: true })
        )
        .then(r => console.log(r.stdout))
    )
'
```

##### Output:
```
README.md:68:          g.rungrepl({ query: "PATH", target: f, fixedStrings: true })
README.md:77:...
```

### Environment setup from source

```sh
rm -rf /tmp/grepl-test && mkdir -p /tmp/grepl-test && cd /tmp/grepl-test
git clone git@github.com:AnthonyRuffino/grepl.git
cd grepl
npm pack
cd ..
npm init -y
npm i grepl/grepl-0.0.1.tgz
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

Usage once installed: grepl [options] <search_string> <file_or_directory>
e.g.
```sh
grepl -c PATH  node_modules/grepl/README.md
```

