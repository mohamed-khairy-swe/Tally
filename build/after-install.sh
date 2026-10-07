#!/bin/bash
# Run after .deb install as root.
# 1. Fix chrome-sandbox setuid so Electron can use the GPU sandbox.
SANDBOX="/usr/lib/tally/chrome-sandbox"
if [ -f "$SANDBOX" ]; then
  chown root "$SANDBOX"
  chmod 4755 "$SANDBOX"
fi

# 2. Patch the .desktop Exec to include --no-sandbox so the app always works
#    even on systems where setuid sandboxing is not available.
DESKTOP_FILE="/usr/share/applications/tally.desktop"
if [ -f "$DESKTOP_FILE" ]; then
  # Only patch if not already patched
  if ! grep -q "\-\-no-sandbox" "$DESKTOP_FILE"; then
    sed -i 's|^Exec=\(.*tally\)\( .*\)\?$|Exec=\1 --no-sandbox\2|' "$DESKTOP_FILE"
  fi
fi
