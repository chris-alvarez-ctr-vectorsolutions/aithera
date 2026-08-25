# Pinned upstream artifacts

Copies of files owned by `VectorLearning/scenario-simulator-poc`, vendored so a
change on their side becomes a **diff in our repo** rather than something we find
out about when an author hits it.

Nothing here is edited by hand. `node tools/roundtrip-check.js` fetches the live
version of each file and fails if it has moved; refresh with
`node tools/roundtrip-check.js --update-pinned` and read the diff before
committing it, because a schema change is a contract change.

| File | Upstream path | Pinned at |
| --- | --- | --- |
| `lo_cml_v4.schema.json` | `app/lo_schema/lo_cml_v4.schema.json` | `66ea6803` (2026-08-13) — the commit that introduced CML v4 |
| `content/*.lo.json` (11) | `app/content/*.lo.json` | 2026-08-25 |

## Why the documents are pinned too

Because the check does two jobs with different credential needs, and bundling
them meant the valuable one could not run at all.

**The regression guard** — round trip and field coverage — asks *did we break the
editor's fidelity?* It wants to run on every push, forever, depending on nobody.
It needs real content, not necessarily live content. So it runs against these
pins, and the CI job that runs it needs no credentials.

**The drift alarm** asks *did their content or schema move?* That genuinely needs
to reach their repo, which is private and different from this one, so it needs a
cross-repo token that only a weekly job (and a developer's own `gh`) has.

The objection to vendoring is real and is answered rather than ignored: a
committed copy goes stale and then reports a green check against content nobody
runs. That is exactly what the drift alarm is for — and it checks the SET of
documents as well as their contents, so a twelfth scenario upstream is noticed
rather than silently unpinned. **A pin without its diff is worse than no pin.**

## Why pinned rather than consumed

`js/scenario-v4.js` still hand-writes the schema's rules in JavaScript, because
its messages are written for an author ("must have at least one entry — omit the
field rather than authoring an empty array") and a generic JSON-Schema walker
produces messages written for a developer. Swapping to the file directly would
regress the panel an LXD lives in.

So the transcription stays, and this pin makes the transcription *checkable*:
when their schema moves, we are told, and we go and update ours deliberately.
Replacing the hand-written schema half with a generic validator driven by this
file — keeping the authored messages as an overlay — is the real fix and is not
done yet.
