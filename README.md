# Bulk rename

Bulk rename using regexes.

## Installation

```shell
npm install -g bulkren
```

## Usage

```
bulkren <path> <find> <replace> [ignore] [options]

path     Path to search the nodes.

find     Regex used to match the node’s name. It doesn’t apply to the
         entire path string.

replace  A pattern for the new name. Use $1, $2, $n... to reference
         capturing groups from the find pattern.

ignore   Regex used to ignore nodes. It applies to the entire path.

Options:
  -n, --dry-run       Test the command.                                [boolean]
  -d, --ignore-dirs   Ignore directories.                              [boolean]
  -f, --ignore-files  Ignore files.                                    [boolean]
  -r, --recursive     List the directories recursively.                [boolean]
  --help              Show help                                        [boolean]
  --version           Show version number                              [boolean]

Examples:
  bulkren . "/foo/i" ../bar baz -d    Find nodes with the name “foo”(case
                                      insensitive), move it to the parent
                                      directory and rename it to “bar”. Any path
                                      containing “baz” is ignored. Directories
                                      named “foo” won’t be affected because of
                                      the flag “-d”.

  bulkren . foo ../bar baz -d         Find nodes with the name “foo”(case
                                      sensitive), move it to the parent
                                      directory and rename it to “bar”. Any path
                                      containing “baz” is ignored. Directories
                                      named “foo” won’t be affected because of
                                      the flag “-d”.

  bulkren . "/(foo)bar/i" "$1baz" -d  Find nodes with the name “foobar”(case
                                      insensitive), and rename it to “foobaz”.
                                      Directories named “foobar” won’t be
                                      affected because of the flag “-d”.
```
