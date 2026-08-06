#!/usr/bin/env bash
#
# Builds the single deployable artifact for SAP BTP Cloud Foundry:
# a Spring Boot fat JAR with the Angular production bundle embedded as
# classpath:/static, so one CF app serves the UI and the API on one origin.
#
# Usage: ./build-cf.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> [1/3] Building Angular production bundle"
cd "$ROOT/frontend"
npm install
npm run build

echo
echo "==> [2/3] Packaging Spring Boot JAR with the bundle embedded"
cd "$ROOT/backend"
./mvnw -Pcf clean package -DskipTests

echo
echo "==> [3/3] Verifying the bundle actually made it into the JAR"
JAR="$(ls "$ROOT"/backend/target/electronics-store-api-*.jar | head -1)"

# maven-resources-plugin only warns when the source directory is missing, so an
# explicit check keeps a UI-less JAR from reaching Cloud Foundry unnoticed.
# Read the listing into a variable first: piping into `grep -q` under pipefail
# fails the pipeline, because grep exits on the first match and unzip gets SIGPIPE.
LISTING="$(unzip -l "$JAR")"

if ! grep -q 'BOOT-INF/classes/static/index.html' <<<"$LISTING"; then
  echo "ERROR: index.html is not in $JAR — the Angular bundle was not embedded." >&2
  echo "       Check that frontend/dist/electronics-store-ui exists." >&2
  exit 1
fi

ASSETS="$(grep -c 'BOOT-INF/classes/static/.' <<<"$LISTING")"
echo "OK: $ASSETS static resources embedded."
echo
echo "Deployable JAR: $JAR"
echo "Next: cf push --no-start  (see DEPLOYMENT.md)"
