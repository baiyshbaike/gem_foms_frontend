#!/usr/bin/env bash
set -Eeuo pipefail

release_id=${1:?Usage: ./deploy.sh <release-id>}
[[ $release_id =~ ^sha-[0-9a-f]{40}-run-[0-9]+-[0-9]+$ ]] \
  || { echo "Invalid release ID." >&2; exit 1; }

umask 022
deploy_root=${DEPLOY_ROOT:-/var/www/dialysis}
archive="$deploy_root/.upload-$release_id.tar.gz"
release="$deploy_root/releases/$release_id"

[[ -f $archive && ! -e $release ]] \
  || { echo "Release archive is missing or release already exists." >&2; exit 1; }

mkdir -p "$release"
tar -xzf "$archive" -C "$release"
[[ -s $release/index.html ]] \
  || { echo "Release has no index.html." >&2; exit 1; }

next_link="$deploy_root/.current-next-$release_id"
ln -s "releases/$release_id" "$next_link"
mv -Tf "$next_link" "$deploy_root/current"
rm -f "$archive"

echo "Frontend release $release_id is active."
