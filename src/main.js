// Licensed under the Apache License, Version 2.0 (the “License”); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.
// @flow

import 'colors'
import ls from 'ls-async'
import toRegexp from 'str-to-regexp'
import path from 'path'
import sortBy from 'sort-array'
import yargonaut from 'yargonaut'
import yargs from 'yargs'

import packageInfo from '../package'

yargonaut.style('blue')
  .errorsStyle('red')

let argv = yargs.usage(
    "bulkren <path> <find> <replace> [ignore] [options]"
    + "\n\n"
    + "path \t Path to search the nodes."
    + "\n\n"
    + "find \t Regex used to match the node’s name. It doesn’t apply to the"
    + "        entire path string."
    + "\n\n"
    + "replace \t A pattern for the new name. Use $1, $2, $n... to reference"
    + "           capturing groups from the find pattern."
    + "\n\n"
    + "ignore \t Regex used to ignore nodes. It applies to the entire path."
  )
  .demand(3)
  .option('n', {
    alias: 'dry-run',
    description: 'Test the command.',
    type: 'boolean'
  })
  .option('d', {
    alias: 'ignore-dirs',
    description: 'Ignore directories.',
    type: 'boolean'
  })
  .option('f', {
    alias: 'ignore-files',
    description: 'Ignore files.',
    type: 'boolean'
  })
  .option('r', {
    alias: 'recursive',
    description: 'List the directories recursively.',
    type: 'boolean'
  })
  .example(
    'bulkren . "/foo/i" ../bar baz -d',
    "Find nodes with the name “foo”(case insensitive), move it to the parent"
    + " directory and rename it to “bar”. Any path containing “baz” is ignored."
    + " Directories named “foo” won’t be affected because of the flag “-d”."
  )
  .example('','')
  .example(
    'bulkren . foo ../bar baz -d',
    "Find nodes with the name “foo”(case sensitive), move it to the parent"
    + " directory and rename it to “bar”. Any path containing “baz” is ignored."
    + " Directories named “foo” won’t be affected because of the flag “-d”."
  )
  .example('','')
  .example(
    'bulkren . "/(foo)bar/i" "$1baz" -d',
    "Find nodes with the name “foobar”(case insensitive), and rename it to “foobaz”."
    + "  Directories named “foobar” won’t be affected because of the flag “-d”."
  )
  .showHelpOnFail(true)
  .help()
  .version(() => packageInfo.version)
  .argv

// Extract arguments.
let [targetPath, findPattern, replacePattern, ignorePattern] = argv._

// Get the full target path.
try {
  targetPath = path.resolve(targetPath)
} catch (e) {
  console.log(`Invalid target path "${targetPath}".`)
  process.exit(-1)
}

// Create the find regex.
try {
  findPattern = toRegexp(findPattern)
} catch (e) {
  console.log(`Invalid find pattern "${findPattern}".`)
  process.exit(-1)
}

// Create the ignore regex.
if (ignorePattern) {
  try {
    ignorePattern = toRegexp(ignorePattern)
  } catch (e) {
    console.log(`Invalid ignore pattern "${ignorePattern}".`)
    process.exit(-1)
  }
}

// Extract the flags.
let {d:ignoreDirs, f:ignoreFiles, r:recursive, n:dry} = argv

const DRY_LABEL = dry ? '[DRY]'.blue : ''
const FAILED_LABEL = '[FAILED]'.red
const RENAMED_LABEL = '[RENAMED]'.green

ls(targetPath, {
  ignore: ignorePattern,
  recursive
})
  .filter(node => !ignoreDirs ? true : !node.stats.isDirectory())
  .filter(node => !ignoreFiles ? true : !node.stats.isFile())
  .filter(node => findPattern.test(node.name))
  // This is required so that we can work on the deepest nodes first.
  .then(nodes => sortBy(nodes, 'path').reverse())
  // Calculate the new path.
  .map(node => ({
    ...node,
    newPath: path.resolve(
      node.parent,
      node.name.replace(findPattern, replacePattern)
    )
  })
  .each(node => {
    try {
      if (!dry) {
        fs.renameSync(node.path, node.newPath)
      }
      console.log(DRY_LABEL, RENAMED_LABEL, node.path, '=>', node.newPath)
    } catch (e) {
      console.log(DRY_LABEL, FAILED_LABEL, node.path, '=>', node.newPath)
    }
  })
