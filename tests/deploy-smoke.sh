#!/usr/bin/env bash
set -Eeuo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
bash -n "$root/deploy/deploy.sh"

temporary_root=$(cd "${TMPDIR:-/tmp}" && pwd -P)
temporary=$(mktemp -d "$temporary_root/gem-foms-web-deploy.XXXXXX")
[[ $temporary == "$temporary_root"/gem-foms-web-deploy.* ]]
trap 'rm -rf -- "$temporary"' EXIT

deploy_root="$temporary/site"
release_id=sha-0123456789abcdef0123456789abcdef01234567-run-1-1
mkdir -p "$deploy_root/releases/old" "$temporary/output/assets"
printf 'old' > "$deploy_root/releases/old/index.html"
ln -s releases/old "$deploy_root/current"
printf 'new' > "$temporary/output/index.html"
printf 'asset' > "$temporary/output/assets/app.js"
tar -C "$temporary/output" -czf "$deploy_root/.upload-$release_id.tar.gz" .

DEPLOY_ROOT="$deploy_root" bash "$root/deploy/deploy.sh" "$release_id"

[[ $(readlink "$deploy_root/current") == "releases/$release_id" ]]
[[ $(cat "$deploy_root/current/index.html") == new ]]
[[ -f "$deploy_root/current/assets/app.js" ]]
[[ -f "$deploy_root/releases/old/index.html" ]]
[[ ! -e "$deploy_root/.upload-$release_id.tar.gz" ]]

if DEPLOY_ROOT="$deploy_root" bash "$root/deploy/deploy.sh" ../invalid 2>/dev/null; then
  echo "Invalid release ID was accepted." >&2
  exit 1
fi
