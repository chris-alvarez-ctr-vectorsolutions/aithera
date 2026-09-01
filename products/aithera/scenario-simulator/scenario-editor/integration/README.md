# Frozen integration build — do not edit

This folder is a **self-contained, frozen copy** of the Scenario Editor, cut on
**2026-09-02**. Learning Studio iframes this build so the K&A team can edit
existing scenarios from inside Studio while the real integration is designed.

Nothing outside this folder can change what it does. It carries its own copy of
all 16 modules and the stylesheet, so work continues on the live editor at
`scenario-editor/` without disturbing the authoring flow running in here.

```
scenario-editor/integration/
  index.html          the page — embedded by default
  css/                its own copy of writer-studio.css
  js/                 its own copy of every module the page loads
```

## How it differs from `scenario-editor/`

| | Frozen cut | Live editor |
| --- | --- | --- |
| Chrome | Hidden by default (`?embed=0` to show it) | Shown |
| Modules | Its own copies, in this folder | Shared `js/` and `css/` |
| Draft storage | `STUDIO_CHANNEL = 'integration'` — its own keys | The default keys |
| `?v=` router | Removed; no sandbox to route to | Routes `?v=2` to the sandbox |
| Changes | None, by design | Wherever iteration happens |

The separate draft keys matter: both builds are served from the same origin, so
without them, iteration on the live editor could reach the drafts K&A are
authoring in here.

## Triggering the new-scenario flow

The top bar is hidden here, so `New scenario` has no button. Three replacements,
which are not interchangeable:

| | Use it when |
| --- | --- |
| `?new=1` | Learning Studio is opening the iframe anyway — after creating the Learning Object, say. Needs a load, so it discards anything in the editor. |
| `?wizard=1` | Same, but skipping the panel and going straight into the wizard. |
| `postMessage` | Mid-session, in place. **The only one that works from Learning Studio**, because a cross-origin parent cannot read into the frame. |

```js
// from the Learning Studio window
iframe.contentWindow.postMessage(
  { source: 'learning-studio', action: 'new-scenario' },  // or 'wizard'
  'https://vectorlearning.github.io'
);
// the editor replies { source: 'scenario-editor', action, ok: true }
```

`window.AitheraStudioHost.openNewScenario()` also exists, but **only works
same-origin** — useful from the console or a same-origin harness, not from
Studio. Reading `iframe.contentWindow.AitheraStudioHost` across an origin
boundary throws.

The listener accepts these two actions from `window.parent` only, reads nothing
from the message, and sends back only an acknowledgement. Add an origin
allowlist once Learning Studio's origin is known.

## What is deliberately not in the cut

The editor's own **Preview as learner** opens `composed-scenarios/index.html`,
which is not copied. That is fine and intended — the preview button is hidden in
embedded mode, and Learning Studio drives preview against the production engine.
If you open this build with `?embed=0`, preview will not resolve.

## Updating it

Do not edit files in here. Re-cut the folder from `scenario-editor/` when a
change is genuinely meant to reach the integration, and say so in
`scenario-editor/RELEASE-NOTES.md`. Re-cutting deliberately is the whole point:
it is what stops iteration reaching the live authoring flow by accident.

Re-cut with a fresh copy of the page plus every local asset it references, then
verify the result reaches nothing outside this folder — an escaping relative path
is the failure mode this pattern exists to prevent, and it fails silently.
