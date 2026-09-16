const { existsSync } = require('node:fs')
const { resolve } = require('node:path')
const process = require('node:process')

const repositoryRoot = resolve(__dirname, '..')

if (existsSync(resolve(repositoryRoot, '.git'))) {
  require('simple-git-hooks').setHooksFromConfig(repositoryRoot).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
