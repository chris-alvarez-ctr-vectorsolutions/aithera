SafeLMS is a product of vector solutions.

## Dashboard Maintenance

There is a prototype index at [`./dashboard/index.html`](./dashboard/index.html) that the UX team shares with PMs and developers as a single link to every in-progress SafeLMS mock. **The entire list of mocks plus their metadata and the recent-activity log come from [`./dashboard/meta.json`](./dashboard/meta.json)** — that JSON file is the *single source of truth* for what the dashboard shows. (The repo is private, so the dashboard cannot discover folders via the GitHub API; it relies on Claude to keep meta.json accurate.)

**Whenever you create, modify, rename, or delete any file under `products/SafeLMS/` (other than under `dashboard/` itself), you MUST also update `dashboard/meta.json` in the same turn.** Do not split this across turns and do not skip it.

### What to update on every edit

1. **Append a `recentChanges` entry** to the top of the array with:
   - `date` — today's date as `YYYY-MM-DD`
   - `path` — file path relative to `products/SafeLMS/` (e.g. `"reports/index.html"`)
   - `summary` — one short past-tense sentence ("Added export filter for course completion data.")
2. **Update `mocks[<folder-key>]` for the mock you touched**, if the change is user-visible:
   - Refresh `description` if the mock's purpose evolved
   - Change `status` if the mock graduated to a new stage: `concept` → `in-progress` → `review` → `ready` (or `archived` for retired work)
   - Add `ticket` if a Jira/Linear ticket is newly associated
3. **Create a new `mocks[<folder-key>]` entry whenever you create a new mock folder.** The key is the folder path relative to `products/SafeLMS/` (e.g. `"onboarding-flow"`, or `"Modals/timeout-warning"` for a sub-section), with no trailing `/index.html`. **A new folder without a matching `mocks` entry will not appear on the dashboard at all** — this step is not optional.
4. **Delete the `mocks[<folder-key>]` entry whenever you delete or rename a mock folder.** Log the rename/deletion in `recentChanges`.
5. **Trim `recentChanges` to the 20 most recent entries** — drop older entries beyond that. Newer entries go at the top.

### Dev handoff files

When you create a `dev_handoff.html` inside a mock folder (a clean, comment-widget-free copy a developer can build from), update that mock's `mocks[<folder-key>]` entry **in the same turn — automatically, without being asked**:

- Set `"devHandoff": true`. The dashboard card then shows two extra links — the dev build's **GitHub Pages** URL (Dev Page) and its **GitHub** raw-HTML URL (Dev HTML) — plus a "Dev Handoff" button, alongside the existing design links.
- Set `"status": "ready-for-dev"`. This moves the card into the **Ready for Dev** group.

`devHandoff` defaults to the filename `dev_handoff.html`; pass a filename string instead of `true` only if the handoff file is named differently. If you later delete the dev_handoff file, remove `devHandoff` and reset the status.

### Why this matters

This page is the single shareable link the team gives stakeholders. Because the repo is private, the dashboard can't fall back to filesystem discovery — meta.json is the entire source of truth. If you forget to update it, mocks vanish or show stale statuses, and the dashboard loses the team's trust. Updating meta.json takes 10 seconds; recovering from a "the dashboard is wrong" complaint costs much more.

### meta.json schema

```json
{
  "version": 1,
  "jiraBaseUrl": "https://<workspace>.atlassian.net/browse/",
  "recentChanges": [
    { "date": "YYYY-MM-DD", "path": "<folder>/<file>", "summary": "Short past-tense sentence." }
  ],
  "mocks": {
    "<folder-key>": {
      "title": "Optional title override (default: humanized folder name)",
      "description": "Optional one-line description shown on the card",
      "status": "concept | in-progress | review | ready | ready-for-dev | archived",
      "ticket": "Optional ticket ID, e.g. SAFELMS-30656",
      "ticketUrl": "Optional full ticket URL (only needed if it lives outside jiraBaseUrl)",
      "devHandoff": "Optional. Set to true (or a filename) when a dev_handoff.html exists — the dashboard then shows the dev build links and the Ready for Dev status"
    }
  }
}
```

**About `jiraBaseUrl`:** when set (e.g. `"https://vectorsolutions.atlassian.net/browse/"`), every mock's `ticket` value is auto-appended to form a clickable link on the dashboard. You only need to fill the per-mock `ticketUrl` when a particular ticket lives in a different Jira instance and the base URL doesn't apply. Leave `jiraBaseUrl` as `""` to render tickets as plain (non-linked) badges.

### Exceptions

- Edits **inside `dashboard/`** (the dashboard's own files) do not require a meta.json update — the dashboard is not a tracked mock.
- Pure documentation tweaks to this CLAUDE.md or the project README do not need a `recentChanges` entry.
