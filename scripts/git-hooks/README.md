# Repo guards — why the root `index.html` is protected

The `index.html` at the **repo root** is the GitHub Pages **landing page** for the
whole site: <https://vectorlearning.github.io/ux-mockups/>. It lists every product
and links to each product dashboard. It is **not a mock**.

Every mock lives at `products/<Product>/<feature>/verN/index.html`. Because mocks
are *also* named `index.html`, a stray write with the wrong path lands on the
landing page instead — which is exactly what happened once: a Pathways
*Course & Exam Tracking V1* mock replaced the landing page, and the live site
served that single mock to everyone until someone noticed.

Three independent guards now prevent that. Each catches what the others miss.

## 1. Claude Code hook (blocks the write before it happens)

`.claude/hooks/protect-landing-page.sh`, wired as a `PreToolUse` hook on
`Write|Edit|MultiEdit` in `.claude/settings.json`. Any attempt by Claude to write
the repo-root `index.html` is denied with an explanation pointing at the correct
`verN/index.html` path.

**To intentionally edit the landing page**, create the unlock sentinel, edit, then
remove it:

```bash
touch .claude/.allow-landing-edit
# ... make the landing-page edit ...
rm .claude/.allow-landing-edit
```

The sentinel is gitignored, so it never travels with a commit.

## 2. Git pre-commit hook (catches writes that bypassed the editor)

`scripts/git-hooks/pre-commit` refuses any commit that stages the root
`index.html`, unless the commit is explicitly about the landing page:

```bash
LANDING=1 git commit -m "Landing page: ..."
```

It also hard-blocks — even with `LANDING=1` — when the staged content has lost the
`GUARD:PAGES-LANDING-PAGE` marker comment, since that is the signature of a
clobber rather than an edit.

**Install it once per clone** (git hooks are not shared through the repo):

```bash
git config core.hooksPath scripts/git-hooks
```

Verify with `git config --get core.hooksPath`.

## 3. GitHub Actions self-heal (protects everyone, no install needed)

`.github/workflows/protect-landing-page.yml` runs on every push that touches
`index.html`. If the file no longer contains the `GUARD:PAGES-LANDING-PAGE`
marker, the workflow restores the newest version that did, commits the restore
with `[skip ci]`, and then **fails the run** so the person who pushed sees it.
The clobbering commit stays in history, so no work is lost — the content just
needs moving to its intended `verN/index.html` path.

This is the layer that covers pushes from GitHub Desktop and from clones where
nobody ran the `core.hooksPath` command.

## The marker

All three guards identify the landing page by one line near the top of the file:

```html
GUARD:PAGES-LANDING-PAGE
```

**Keep that comment block.** Redesigning the landing page is fine; dropping the
marker is what makes the file unrecognisable to the guards.
