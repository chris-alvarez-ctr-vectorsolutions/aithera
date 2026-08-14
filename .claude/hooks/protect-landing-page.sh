#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Guard 1 of 3: Claude Code PreToolUse hook.
#
# Blocks Write/Edit/MultiEdit on the repo-root index.html — the GitHub Pages
# landing page (https://vectorlearning.github.io/ux-mockups/). That file was
# once clobbered by a mock written to the wrong path, which silently replaced
# the whole site index with a single Pathways prototype.
#
# Mocks belong at products/<Product>/<feature>/verN/index.html. Only a request
# that is explicitly about the landing page should ever touch the root file.
#
# To intentionally edit the landing page, create the unlock sentinel first:
#     touch .claude/.allow-landing-edit     # then edit; then rm it
#
# Reads the PreToolUse JSON payload on stdin, prints a permission decision.
# ─────────────────────────────────────────────────────────────────────────────

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')"

# Not a file-targeting tool call — nothing to guard.
[ -z "$file_path" ] && exit 0

# Only the file literally named index.html at a git repo root is protected.
case "$(basename "$file_path")" in
  index.html) ;;
  *) exit 0 ;;
esac

dir="$(dirname "$file_path")"
[ -d "$dir" ] || exit 0
repo_root="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || exit 0
[ -n "$repo_root" ] || exit 0

# Resolve both sides so /private/tmp vs /tmp style symlinks compare equal.
resolved_dir="$(cd "$dir" 2>/dev/null && pwd -P)" || exit 0
resolved_root="$(cd "$repo_root" 2>/dev/null && pwd -P)" || exit 0
[ "$resolved_dir" = "$resolved_root" ] || exit 0

# Unlock sentinel present → the user explicitly asked for a landing-page edit.
if [ -f "$repo_root/.claude/.allow-landing-edit" ]; then
  exit 0
fi

cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "BLOCKED: that path is the repo-root index.html — the GitHub Pages landing page for the entire ux-mockups site, not a mock. It was clobbered once this way. If you are building or editing a MOCK, write to products/<Product>/<feature>/verN/index.html instead. Only if the user explicitly asked to change the LANDING PAGE itself, unlock it by running `touch .claude/.allow-landing-edit`, make the edit, then `rm .claude/.allow-landing-edit`."
  }
}
JSON
exit 0
