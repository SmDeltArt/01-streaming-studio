#!/usr/bin/env bash
set -euo pipefail
PATHS=(index.html src css assets docs favicon.ico VERSION); git switch main; if git show-ref --verify --quiet refs/heads/websim; then git switch websim; else git checkout -b websim; fi; find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name '.gitignore' -exec rm -rf {} +; git checkout main -- "${PATHS[@]}"; git add -A; git commit -m 'chore(websim): sync' || true; git push -u origin websim; git switch main
