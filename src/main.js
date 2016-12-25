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

import 'colors'
import fs from 'graceful-fs'
import path from 'path'
import Promise from 'bluebird'
import yargs from 'yargs'

Promise.promisifyAll(fs)

let argv = yargs.usage('bulkren <path> <find> <replace> [exclude]')
  .option('n', {
    alias: 'dry-run',
    describe: 'Test the command.',
    type: 'boolean'
  })
  .option('f', {
    alias: 'files',
    describe: 'Match files.',
    type: 'boolean',
    default: undefined
  })
  .option('d', {
    alias: 'dirs',
    describe: 'Match directories.',
    type: 'boolean',
    default: undefined
  })
  .option('r', {
    alias: 'recursive',
    describe: 'List the directories recursively.',
    type: 'boolean'
  })
  .example(
    'bulkren . "/\\/(.+?)\\.scss$/" "../$1.css"',
    'Find nodes ending with ".scss", captures the name and move it to the ' +
    'parent directory while changing the extension to css.'
  )
  .alias('h', 'help')
  .help()
  .argv

function listDir(fullTargetPath) {
  return fs.readdirAsync(fullTargetPath)
    .map(node => ({
      parent: fullTargetPath,
      path: path.join(fullTargetPath, node)
    }))
    .map(node =>
      fs.statAsync(node.path)
        .then(stats => ({...node, stats}))
    )
}

function listDirRecursively(targetPath) {
  let result = []
  return Promise.all(
      listDir(targetPath)
        .each(node => result.push(node))
        .filter(node => node.stats.isDirectory())
        .map(node => listDirRecursively(node.path))
    )
    .each(subDirContents => {
      result = result.concat(subDirContents)
    })
    .then(() => result)
}

// Extract arguments.
let [targetPath, findPattern, replacePattern, excludePattern] = argv._

// Get the full target path.
try {
  targetPath = path.resolve(targetPath)
} catch (e) {
  console.log(`Invalid target path "${targetPath}".`)
  process.exit(-1)
}

// Create the find regex.a
try {
  let [, pattern, options] = findPattern.match(/^\/(.+)\/(.*?)$/)
  findPattern = new RegExp(pattern, options)
} catch (e) {
  console.log(`Invalid find pattern "${findPattern}".`)
  process.exit(-1)
}

// Create the exclusion regex.
if (excludePattern) {
  try {
    let [, pattern, options] = excludePattern.match(/^\/(.+)\/(.*?)$/)
    excludePattern = new RegExp(pattern, options)
  } catch (e) {
    console.log(`Invalid exclusion pattern "${excludePattern}".`)
    process.exit(-1)
  }
}

// Extract the flags.
let {
  d:dirs = true,
  f:files = true,
  r:recursive,
  n:dry
} = argv

const DRY_LABEL = dry ? '[DRY]'.blue : ''
const EXCLUDED_LABEL = '[EXCLUDED]'.yellow
const FAILED_LABEL = '[FAILED]'.red
const RENAMED_LABEL = '[RENAMED]'.green

// List the nodes.
let nodes = recursive
  ? listDirRecursively(targetPath)
  : listDir(targetPath)

// Filter.
nodes.filter(node => (
    dirs && node.stats.isDirectory() ||
    files && node.stats.isFile()
  ) &&
  findPattern.test(node.path)
)
// Exclude if necessary.
.filter(node => {
  if (excludePattern && excludePattern.test(node.path)) {
    console.log(DRY_LABEL, EXCLUDED_LABEL, node.path)
    return false
  }
  return true
})
// This is required so that we can work on the deepest nodes first.
.then(nodes => nodes.sort().reverse())
// Calculate the new path.
.map(node => {
  node.newPath = path.resolve(
    node.path.replace(findPattern, replacePattern)
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
