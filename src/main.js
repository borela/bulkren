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
import path from 'path'
import sortBy from 'sort-array'
import yargs from 'yargs'

let argv = yargs.usage('bulkren <path> <find> <replace> [ignore]')
  .option('n', {
    alias: 'dry-run',
    describe: 'Test the command.',
    type: 'boolean'
  })
  .option('f', {
    alias: 'ignore-files',
    describe: 'Ignore files.',
    type: 'boolean'
  })
  .option('d', {
    alias: 'ignore-dirs',
    describe: 'Ignore directories.',
    type: 'boolean'
  })
  .option('r', {
    alias: 'recursive',
    describe: 'List the directories recursively.',
    type: 'boolean'
  })
  .example(
    'bulkren . "/foo/i" "../bar" "/baz/" -d',
    'Find files with the name foo(case insensitive) and move it to the parent directory. ' +
    'Any path containing “baz” is ignored. Directories named “foo” won’t be affected ' +
    'because of the flag “-d”.'
  )
  .help()
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
  let [, pattern, options] = findPattern.match(/^\/(.+)\/(.*?)$/)
  findPattern = new RegExp(pattern, options)
} catch (e) {
  console.log(`Invalid find pattern "${findPattern}".`)
  process.exit(-1)
}

// Create the ignore regex.
if (ignorePattern) {
  try {
    let [, pattern, options] = ignorePattern.match(/^\/(.+)\/(.*?)$/)
    ignorePattern = new RegExp(pattern, options)
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
  // Filter.
  .filter(node => !ignoreDirs ? true : !node.stats.isDirectory())
  .filter(node => !ignoreFiles ? true : !node.stats.isFile())
  .filter(node => findPattern.test(node.name))
  // This is required so that we can work on the deepest nodes first.
  .then(nodes => sortBy(nodes, 'path').reverse())
  // Calculate the new path.
  .map(node => {
    node.newPath = path.resolve(
      node.parent,
      node.name.replace(findPattern, replacePattern)
    )
    return node
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
