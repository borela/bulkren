# Bulk rename

Bulk rename using regexes.

## Installation

```shell
npm install -g bulkren
```

## Usage

```shell
bulkren <find> <replace> [exclude]
```

#### Find

Regex pattern used to select a path.

#### Replace

Pattern used for the new name. Use `$1, $2, $n...` to reference capturing groups
from the find pattern.

#### Exclude (Optional)

Regex used to exclude paths selected in the find pattern. Use `$1, $2, $n...` to
reference capturing groups from the find pattern.
