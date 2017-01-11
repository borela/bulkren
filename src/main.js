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

import chalk from 'chalk'
import fs from 'graceful-fs'
import ls from 'ls-async'
import path from 'path'
import sortBy from 'sort-array'
import toRegexp from 'str-to-regexp'
import yargonaut from 'yargonaut'
import yargs from 'yargs'
import {diffChars} from 'diff'

import packageInfo from '../package'

yargonaut.style('blue')
  .errorsStyle('red')

let argv = yargs.usage(
    'bren \t <path> <find> <replace> [ignore] [options]'
    + '\n'
    + 'bulkren \t <path> <find> <replace> [ignore] [options]'
    + '\n\n'
    + '<path> \t Path to search the nodes.'
    + '\n\n'
    + '<find> \t Regex used to match the node’s name. It applies only to the'
    + '          node’s name, not the entire path.'
    + '\n\n'
    + '<replace> \t A pattern for the new name. Use $1, $2, $n... to reference'
    + '             capturing groups from the find pattern.'
    + '\n\n'
    + '[ignore] \t Regex used to ignore nodes. It applies to the entire path.'
  )
  .demand(3, 4)
  .option('n', {
    alias: ['dry', 'dry-run'],
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
  .option('s', {
    alias: 'silent',
    description: 'Don’t output anything to the standard outputs.',
    type: 'boolean'
  })
  .example(
    'bren . "/foo/i" ../bar baz -d',
    'Find nodes with the name “foo”(case insensitive), move it to the parent'
    + ' directory and rename it to “bar”. Any path containing “baz” is ignored.'
    + ' Directories named “foo” won’t be affected because of the flag “-d”.'
  )
  .example('','')
  .example(
    'bren . foo ../bar baz -d',
    'Find nodes with the name “foo”(case sensitive), move it to the parent'
    + ' directory and rename it to “bar”. Any path containing “baz” is ignored.'
    + ' Directories named “foo” won’t be affected because of the flag “-d”.'
  )
  .example('','')
  .example(
    'bren . "/(foo)bar/i" "$1baz" -d',
    'Find nodes with the name “foobar”(case insensitive), and rename it to “foobaz”.'
    + '  Directories named “foobar” won’t be affected because of the flag “-d”.'
  )
  .showHelpOnFail(true)
  .help(
    'help',
    'Show usage instructions.'
  )
  .version(
    'version',
    `Show ${packageInfo.name} version.`,
    () => packageInfo.version
  )
  .argv

let [targetPath, findPattern, replacePattern, ignorePattern] = argv._

let ignoreDirs = argv.d || argv['ignore-dirs']
let ignoreFiles = argv.f || argv['ignore-files']
let recursive = argv.r || argv.recursive
let dry = argv.n || argv.dry || argv['dry-run']
let silent = argv.s || argv.silent

function error(...args) {
  console.error(...args)
  process.exit(-1)
}

function log(...args) {
  console.log(...args)
}

// Get the full target path.
try {
  targetPath = path.resolve(targetPath)
} catch (e) {
  error(`Invalid target path "${targetPath}".`)
}

// Create the find regex.
try {
  findPattern = toRegexp(findPattern)
} catch (e) {
  error(`Invalid find pattern "${findPattern}".`)
}

// Create the ignore regex.
if (ignorePattern) {
  try {
    ignorePattern = toRegexp(ignorePattern)
  } catch (e) {
    error(`Invalid ignore pattern "${ignorePattern}".`)
  }
}

const DRY_LABEL = chalk.blue('[DRY]')
const FAILED_LABEL = chalk.red('[FAILED]')
const RENAMED_LABEL = chalk.green('[RENAMED]')

function logPathDiff(node) {
  let parent = node.parent + path.sep
  let nameDiff = diffChars(node.name, node.newName)

  let oldPath = nameDiff.filter(char => !char.added)
    .reduce(
      (result, {removed, value}) =>
        result + (removed ? chalk.red(value) : value),
      parent
    )

  let newPath = nameDiff.filter(char => !char.removed)
    .reduce(
      (result, {added, value}) =>
        result + (added ? chalk.green(value) : value),
      parent
    )

  log(oldPath, chalk.blue('=>'))
  log(newPath)
  log('')
}

ls(targetPath, {
  ignore: ignorePattern,
  ignoreDirs,
  ignoreFiles,
  recursive
})
  .filter(node => findPattern.test(node.name))
  // This is required so that we can work on the deepest nodes first.
  .then(nodes => sortBy(nodes, 'path').reverse())
  // Execute the action if its not a dry run.
  .each(node => {
    node.newName = node.name.replace(findPattern, replacePattern)
    node.newPath = path.join(node.parent, node.newName)

    if (dry) {
      log(DRY_LABEL, RENAMED_LABEL)
      logPathDiff(node)
      return
    }

    try {
      // We want this to be synchronous to make sure we are renaming the deepest
      // nodes first.
      fs.renameSync(node.path, node.newPath)
    } catch (e) {
      log(FAILED_LABEL)
      logPathDiff(node)
      error(e)
    }

    log(RENAMED_LABEL)
    logPathDiff(node)
  })
