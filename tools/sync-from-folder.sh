#!/usr/bin/env bash
set -euo pipefail
SRC="$1"; MSG="$2"; for f in src css assets docs; do [ -d "$f" ]&&rm -rf "$f"; [ -d "$SRC/$f" ]&&cp -R "$SRC/$f" ./; done; for f in index.html favicon.ico VERSION; do [ -f "$SRC/$f" ]&&cp "$SRC/$f" ./; done; echo -e "\n## $(date +%F)\n- $MSG\n" >> CHANGELOG.md; git add .; git commit -m "$MSG"; git push
