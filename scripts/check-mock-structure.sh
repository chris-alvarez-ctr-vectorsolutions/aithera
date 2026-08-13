#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Advisory: nudge NEW mock pages toward versioning + the Design Toolbox.
#
# Policy (see CLAUDE.md "For a NEW mock"): new features are scaffolded from
# base-template/ as a versioned folder — loader index.html + versions.json +
# verN/index.html — and every design page ships the designtoolbox/toolbox.js
# include (comment widget + flow map) with comments ENABLED. That is the
# recommended default the template gives you for free.
#
# It is NOT enforced and NOT run automatically. The versioned loader, the comment
# widget, and the flow map are OPTIONAL — offered at setup, never required. This
# script is a MANUAL, opt-in advisory: it only PRINTS A HEADS-UP and always exits
# 0, and nothing calls it on commit. (A missing toolbox once failed teammates'
# commits; that hard block, and later even the on-commit heads-up, were removed —
# run this by hand only if you want to review a mock's structure.)
#
# Noticed per new products/**/*.html file (full pages only):
#   1. Whether it lives inside a verN/ folder (ver1/, ver2.x/, …) — versioned.
#   2. Whether it includes designtoolbox/toolbox.js.
#   3. Whether it disables comments (window.TOOLBOX = { comments: false }) in a
#      design file — that override belongs only in dev_handoff*.html builds.
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
# Silence the heads-up entirely (it never blocks either way):
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
add_violation() { violations="${violations}  • $1
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

  # 1. Versioning: is the page inside a verN/ folder? (optional, recommended)
  if ! printf '%s' "$f" | grep -qE '/ver[0-9][^/]*/'; then
    add_violation "$f — not inside a verN/ folder. The versioned layout (loader index.html + versions.json + ver1/index.html, copied from base-template/) is recommended but optional. See CLAUDE.md → 'For a NEW mock'."
  fi

  # 2. Comments: is the Design Toolbox include present? (optional, recommended)
  if ! printf '%s' "$content" | grep -q 'designtoolbox/toolbox\.js'; then
    add_violation "$f — no Design Toolbox include (<script src=\"../../../../designtoolbox/toolbox.js\"></script> before </body>). Adds the comment widget + flow map — recommended, but optional; add it whenever you want them."
  fi

  # 3. …and if the toolbox IS included, flag comments:false in a design file.
  if printf '%s' "$content" | grep -qE 'comments[[:space:]]*:[[:space:]]*false'; then
    add_violation "$f — sets comments: false. In a design file comments are normally left on; that override is expected only in dev-handoff builds (*dev_handoff*.html)."
  fi
done <<< "$FILES"

if [ -n "$violations" ]; then
  cat >&2 <<EOF

  ℹ Heads-up (not blocking) — new mock page(s) skip the recommended setup:

$violations
  The versioned feature folder + Design Toolbox (comment widget & flow map) are
  the default you get for free by scaffolding from base-template/version.html —
  recommended, but OPTIONAL. Your commit will proceed. Add the toolbox later if
  you want comments/flow map, or silence this notice with SKIP_MOCK_GUARD=1.

EOF
fi

# Advisory only — never block a commit.
exit 0
