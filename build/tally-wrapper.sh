#!/bin/bash
# Wrapper to ensure --no-sandbox is always passed to the Electron binary.
# This is needed on Linux systems where chrome-sandbox is not setuid root.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/tally" --no-sandbox "$@"
