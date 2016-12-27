# Bulk rename

Bulk rename using regexes.

## Installation

```shell
npm install -g bulkren
```

## Usage

```
bulkren <path> <find> <replace> [ignore]

Options:
  -n, --dry-run       Test the command.                                [boolean]
  -f, --ignore-files  Ignore files.                                    [boolean]
  -d, --ignore-dirs   Ignore directories.                              [boolean]
  -r, --recursive     List the directories recursively.                [boolean]
  --help              Show help                                        [boolean]

Examples:
  bulkren . "/foo/i" "../bar" "/baz/" -d  Find files with the name foo(case
                                          insensitive) and move it to the parent
                                          directory. Any path containing “baz”
                                          is ignored. Directories named “foo”
                                          won’t be affected because of the flag
                                          “-d”.
```

#### Find

Regex pattern used to select a path. This pattern applies to the node’s name.

#### Replace

Pattern used for the new name. Use `$1, $2, $n...` to reference capturing groups
from the find pattern.

#### Ignore (Optional)

Regex used to ignore paths selected in the find pattern. This pattern applies to
the entire path.
