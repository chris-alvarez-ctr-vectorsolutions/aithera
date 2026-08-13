#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Guard: every NEW mock page must be versioned and carry the Design Toolbox.
#
# Policy (see CLAUDE.md "For a NEW mock"): every new feature in every product is
# a versioned folder — loader index.html + versions.json + verN/index.html — and
# every design page ships the designtoolbox/toolbox.js include with comments
# ENABLED. This applies to ALL products, not just SafeLMS/Scheduling. Older flat
# mocks are grandfathered; this guard only inspects files being ADDED.
#
# Checked per new products/**/*.html file (full pages only):
#   1. It lives inside a verN/ folder (ver1/, ver2.x/, …) — i.e. it is versioned.
#   2. It includes designtoolbox/toolbox.js.
#   3. It does not disable comments (window.TOOLBOX = { comments: false }) —
#      that override belongs only in dev_handoff*.html builds.
#
# Skipped: dev_handoff*.html, loaders (they reference versions.json), dashboard/
# archive/ before-screenshots/ folders, any path segment starting with "_",
# fragments without a <body> tag, and products/aithera/ (a flat workspace of
# standalone experiment pages — exempt from versioning + toolbox).
#
# Usage:
#   check-mock-structure.sh --staged            # pre-commit: staged added files
#   check-mock-structure.sh --range BASE HEAD   # CI: files added in a push
#
# Bypass (rare, e.g. intentionally restoring a legacy flat file):
#   SKIP_MOCK_GUARD=1 git commit ...
# ─────────────────────────────────────────────────────────────────────────────

set -u

if [ "${SKIP_MOCK_GUARD:-}" = "1" ]; then
  echo "  ⚠ Mock-structure guard bypassed via SKIP_MOCK_GUARD=1." >&2
  exit 0
fi

MODE="${1:---staged}"

if [ "$MODE" = "--range" ]; then
  BASE="$2"; HEAD="$3"
  FILES=$(git diff --name-only --diff-filter=A "$BASE" "$HEAD" -- 'products/' | grep -i '\.html$' || true)
  content_of() { git show "$HEAD:$1" 2>/dev/null; }
else
  FILES=$(git diff --cached --name-only --diff-filter=A -- 'products/' | grep -i '\.html$' || true)
  content_of() { git show ":$1" 2>/dev/null; }
fi

[ -z "$FILES" ] && exit 0

violations=''
add_violation() { violations="${violations}  ✗ $1
"; }

while IFS= read -r f; do
  [ -z "$f" ] && continue
  base=$(basename "$f")

  # Dev-handoff builds are copies with comments intentionally off. Both naming
  # styles in use count: "dev_handoff*.html" and "<mock name>_dev_handoff.html".
  case "$base" in *dev_handoff*.html) continue ;; esac

  # Non-mock housekeeping locations.
  case "/$f" in
    */dashboard/*|*/archive/*|*/before-screenshots/*|*/_*) continue ;;
  esac

  # aithera is exempt: it is a flat workspace of standalone experiment pages,
  # not versioned feature folders, and its pages don't carry the toolbox.
  case "$f" in
    products/aithera/*) continue ;;
  esac

  content=$(content_of "$f")
  [ -z "$content" ] && continue

  # Fragments/partials aren't pages.
  printf '%s' "$content" | grep -qi '<body' || continue

  # The feature-root loader is allowed outside verN/ — it's the one file that
  # reads versions.json.
  if printf '%s' "$content" | grep -q 'versions.json'; then continue; fi

  # 1. Versioning: the page must live in a verN/ folder.
  if ! printf '%s' "$f" | grep -qE '/ver[0-9][^/]*/'; then
    add_violation "$f — not inside a verN/ folder. New mocks are versioned: loader index.html + versions.json + ver1/index.html (copy both from base-template/). See CLAUDE.md → 'For a NEW mock'."
  fi

  # 2. Comments: the Design Toolbox include must be present…
  if ! printf '%s' "$content" | grep -q 'designtoolbox/toolbox\.js'; then
    add_violation "$f — missing the Design Toolbox include (<script src=\"../../../../designtoolbox/toolbox.js\"></script> before </body>). Every new mock in every product gets comments."
  fi

  # 3. …and comments must not be disabled in a design file.
  if printf '%s' "$content" | grep -qE 'comments[[:space:]]*:[[:space:]]*false'; then
    add_violation "$f — sets comments: false. Comments stay ENABLED in design files; that override belongs only in dev-handoff builds (*dev_handoff*.html)."
  fi
done <<< "$FILES"

if [ -n "$violations" ]; then
  cat >&2 <<EOF

  ✋ BLOCKED — new mock page(s) missing versioning and/or the comment toolbox:

$violations
  Every new mock, in every product, is scaffolded as a versioned feature folder
  with the Design Toolbox (comments enabled). base-template/version.html already
  has the include — scaffold from it. To bypass for a genuine exception:
      SKIP_MOCK_GUARD=1 git commit ...

EOF
  exit 1
fi

exit 0
