# Bulk rename

Bulk rename using regexes.

## Installation

```shell
npm install -g bulkren
```

## Usage

```
bulkren <path> <find> <replace> [exclude]

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

Regex pattern used to select a path.

#### Replace

Pattern used for the new name. Use `$1, $2, $n...` to reference capturing groups
from the find pattern.

#### Exclude (Optional)

Regex used to exclude paths selected in the find pattern. Use `$1, $2, $n...` to
reference capturing groups from the find pattern.
