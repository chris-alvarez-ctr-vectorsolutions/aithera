# Planning — LearningStudio Phase 2

Working folder for specs, bug reports and strategy docs behind the Phase 2
prototypes. Drop PRDs, specs, notes, screenshots or exports here and ask Claude
to reconcile them against a mock.

Moved here from the `Phase2/` root so the product folder holds prototypes and
this folder holds the thinking behind them.

## This folder is local-only

**Everything in here except this README is git-ignored** — see the
`products/LearningStudio/Phase2/_planning/` rule in the repo root `.gitignore`.
Nothing you add gets committed, pushed to GitHub, published to the GitHub Pages
site, or listed in the LearningStudio dashboard's Recent activity.

That matters because these docs are frequently confidential and the dashboard's
Recent activity panel is rebuilt from `git log` — any *committed* file under
`products/LearningStudio/` is listed there by filename and commit message.

Consequences of local-only, so nothing is a surprise:

- **Teammates do not get these files.** Another clone of this repo will have an
  empty `_planning/`. Share docs through the usual channel
  (Jira/Confluence/Slack), not by expecting them here.
- **They are not backed up by git.** A clean checkout, a reset, or a new machine
  loses them. Keep the system of record elsewhere.
- **These three files were previously tracked.** Their history still exists in
  git up to the commit that untracked them, so older revisions remain in the
  public history and are recoverable with `git log --follow`. Untracking stops
  *future* changes from being published; it does not erase the past.

To deliberately commit something from here, force it past the ignore rule:

```sh
git add -f products/LearningStudio/Phase2/_planning/<file>
```

Only do that for a file you are comfortable publishing to a public repo.

## What was moved here

| File | What it is |
|---|---|
| `chat-builder-setup-and-planning-spec.md` | Spec for the chat-builder setup/planning flow; referenced by `../content-workflow/README.md`. |
| `learning-studio-bug-report.md` | Running bug list behind the `EditorUI/objectManager.html` fixes. |
| `phase2-strategy-summary.md` | Phase 2 strategy/scope summary. |

## Suggested use

- Keep the original filename so it stays traceable to the ticket.
- Markdown and PDF both work; Claude can read either.
- For a full reconciliation of mock vs. PRD at handoff time, use the
  `ux-wrapup` skill — it takes a PRD path and produces `mock-definition.md`.
