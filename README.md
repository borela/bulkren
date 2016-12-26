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
  -n, --dry-run    Test the command.                                   [boolean]
  -f, --files      Match files.                                        [boolean]
  -d, --dirs       Match directories.                                  [boolean]
  -r, --recursive  List the directories recursively.                   [boolean]
  -h, --help       Show help                                           [boolean]

Examples:
  bulkren . "/\/(.+?)\.scss$/" "../$1.css"  Find nodes ending with ".scss",
                                            captures the name and move it to the
                                            parent directory while changing the
                                            extension to css.
```

#### Find

Regex pattern used to select a path. This pattern applies to the node’s name.

#### Replace

Pattern used for the new name. Use `$1, $2, $n...` to reference capturing groups
from the find pattern.

#### Ignore (Optional)

Regex used to ignore paths selected in the find pattern. This pattern applies to
the entire path.
