# Planning — Checklist Management

Working folder for PRDs and source documents used to analyse the prototype in
`ver1/`. Drop PRDs, specs, notes, screenshots or exports here and ask Claude to
reconcile them against the mock.

## This folder is local-only

**Everything in here except this README is git-ignored** — see the
`products/check-it/Checklist-management/_planning/` rule in the repo root
`.gitignore`. Nothing you add gets committed, pushed to GitHub, published to the
GitHub Pages site, or listed in the Check It dashboard's Recent activity.

That matters because PRDs are frequently confidential and the dashboard's
Recent activity panel is rebuilt from `git log` — any *committed* file under
`products/check-it/` is listed there by filename and commit message.

Consequences of local-only, so nothing is a surprise:

- **Teammates do not get these files.** Another clone of this repo will have an
  empty `_planning/`. Share PRDs through the usual channel (Jira/Confluence/Slack),
  not by expecting them here.
- **They are not backed up by git.** A clean checkout, a reset, or a new machine
  loses them. Keep the system of record elsewhere.

To deliberately commit something from here, force it past the ignore rule:

```sh
git add -f products/check-it/Checklist-management/_planning/<file>
```

Only do that for a file you are comfortable publishing to a public repo.

## Suggested use

- Keep the original PRD filename so it is traceable to the ticket.
- Markdown and PDF both work; Claude can read either.
- For a full reconciliation of mock vs. PRD at handoff time, use the
  `ux-wrapup` skill — it takes a PRD path and produces `mock-definition.md`.
