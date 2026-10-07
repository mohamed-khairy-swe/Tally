#!/bin/bash
# Post-installation script for Tally (.deb and .rpm)

# 1. Fix chrome-sandbox permissions at the actual installed location /opt/Tally/chrome-sandbox
SANDBOX="/opt/Tally/chrome-sandbox"
if [ -f "$SANDBOX" ]; then
  chown root:root "$SANDBOX" 2>/dev/null || chown root "$SANDBOX" 2>/dev/null || true
  chmod 4755 "$SANDBOX" 2>/dev/null || true
fi

# 2. Also check /usr/lib/tally if packaged there on some configurations
if [ -f "/usr/lib/tally/chrome-sandbox" ]; then
  chown root:root "/usr/lib/tally/chrome-sandbox" 2>/dev/null || chown root "/usr/lib/tally/chrome-sandbox" 2>/dev/null || true
  chmod 4755 "/usr/lib/tally/chrome-sandbox" 2>/dev/null || true
fi

# 3. Patch .desktop file so that --no-sandbox is always included in Exec
#    This guarantees the app launches on modern Ubuntu (24.04+), Debian, Fedora, Arch,
#    regardless of unprivileged user namespace or apparmor kernel restrictions.
for DESKTOP_FILE in /usr/share/applications/tally.desktop /usr/share/applications/Tally.desktop; do
  if [ -f "$DESKTOP_FILE" ]; then
    if ! grep -q -- "--no-sandbox" "$DESKTOP_FILE"; then
      sed -i 's|Exec=\([^ ]*\)\(.*\)|Exec=\1 --no-sandbox\2|' "$DESKTOP_FILE"
    fi
  fi
done

# 4. Create symlink in /usr/bin/tally if not already present
if [ -f "/opt/Tally/tally" ] && [ ! -f "/usr/bin/tally" ]; then
  ln -sf /opt/Tally/tally /usr/bin/tally 2>/dev/null || true
fi
