#!/usr/bin/env bash
# Legacy wrapper — the build script is now build.ts (requires Bun).
# Usage: ./build.sh [--crate-dir <path>] [--skip-wasm] [--skip-site] [--parallel <n>]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bun run "$SCRIPT_DIR/build.ts" "$@"
