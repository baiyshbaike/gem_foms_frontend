module.exports = {
  'pre-commit': 'pnpm lint && pnpm test --run --pool=threads --maxWorkers=1',
}
