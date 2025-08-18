#!/usr/bin/env bash
set -euo pipefail
TAG="$1"; MSG="$2"; git tag "$TAG" -m "$MSG"; git push origin "$TAG"; if git show-ref --verify --quiet refs/heads/stable; then git switch stable; else git checkout -b stable; fi; git merge --ff-only "$TAG"; git push -u origin stable; git switch -
