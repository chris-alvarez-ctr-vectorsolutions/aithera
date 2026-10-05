# Build notes — Requisition Workflow (POC)

**Mock:** `ver1/index.html` · *Created 2026-10-05*

This prototype was built **before a PRD existed**, on purpose. It is a
stakeholder buy-in POC meant to show *how we might approach* personal-issue
requisitions — not a specification of how they will work.

Everything below exists so the prototype can be shown without being mistaken
for a decision. Section 2 is the important one: it lists the rules the mock
deliberately does **not** model, so a stakeholder seeing a clean demo does not
assume those questions are settled.

---

## 1. The model the mock proposes

The one real proposal here is the **shape of the data**, because it is what
makes the three entry points one feature rather than three.

A requisition is **a request to change an assignment** — not an order against
a store room. It points at a catalog item, and when replacing, at the specific
assigned instance being replaced:

```
requisition {
  id, requester, unit,
  catalogId,            // what is wanted
  assignmentId | null,  // the instance being replaced (null for 'new')
  reason: 'replace' | 'new' | 'renewal',
  detail, size, qty, neededBy,
  status: 'draft' | 'submitted' | 'approved' | 'denied' | 'issued',
  history: [ { at, by, action, note } ]
}
```

Consequences that are visible in the mock and worth confirming with stakeholders:

1. **The entry point is "my stuff", not "the catalog".** The requester's home is
   *My Assigned Items* — gear issued to them, each showing its condition. The
   damaged pants carry a "Request replacement" button, so the request starts
   from the thing that is wrong rather than from a form.

2. **Reason is a property of one act, not three different acts.** Replacement,
   new issue and scheduled renewal all use the same form; the reason changes
   which fields it asks for (photo and "what happened?" for damage, justification
   for a new issue, neither for a renewal). This is a deliberate alternative to
   three separate request flows.

3. **Only reasons that make sense are offered.** You cannot "replace" something
   never issued to you, so a catalog request offers only *New issue*, and an
   assigned item offers *Replacement* / *Scheduled renewal*.

4. **Issuing is where the assignment changes hands.** The fulfiller's confirm
   dialog states the consequence in words — *"This halligan bar becomes assigned
   to Tom Okafor. Their existing unit (SB-55120) is returned and taken out of
   service."* — because that transfer, not the status flip, is the point.

5. **An item with an open request does not offer a second one.** The card shows
   the live status instead. Prevents the most obvious duplicate.

---

## 2. Deliberately NOT modelled

These are unanswered questions, not oversights. The mock shows *a* behaviour
where it needed one to be legible; none of it should be read as a decision.

| Area | What the mock does | What is actually undecided |
|---|---|---|
| **Approval routing** | One approver ("your company officer") decides everything. | Whether approval is one step or several; whether value, item class or reason changes the route; who approves when the officer is the requester. |
| **Approval thresholds** | Every request needs a human decision. | Whether renewals auto-approve on the due date, and whether low-value consumables need approval at all. The requester-facing routing note *says* renewals "are usually approved automatically" — that sentence is illustrative placeholder copy. |
| **Stock & reservation** | Stock is a display number, decremented on issue. Zero stock disables the Issue button. | There is no reservation model. Nothing holds stock between approval and issue, so two approved requests can both claim the last unit. Backorder ("Webbing & Carabiner Set") is shown as a label only. |
| **Entitlement rules** | Renewal is driven by a `due` date on the assignment. | What sets that date, per item class; whether entitlement is per-person or per-rank; what happens to an overdue item. |
| **Cost / budget** | Absent entirely. | Cost centres, charge-back to a unit, budget limits as an approval input. |
| **Returns & disposal** | The old unit is "returned and taken out of service" in copy only. | Whether a return is its own tracked step, who confirms receipt, what happens to serviceable returned gear. |
| **Lost / stolen** | Not built. | Deliberately out of scope for the POC — it carries accountability rules nobody has defined, and showing it half-built invites the wrong conversation. Expect it to be raised; it is a known gap, not an omission. |
| **Notifications** | None. | Whether the requester is notified on decision/issue, and through what channel. |
| **Quantity** | Capped at 3 in the picker. | Arbitrary. Whether a personal-issue request can ever be bulk is an open question. |
| **Sizes** | A flat list per catalog item. | No size profile on the person, so size is re-picked every time. A stored profile is an obvious improvement nobody has specified. |

---

## 3. Demo mechanics (not product)

- **The "Viewing as" role switcher in the top bar is a demo affordance.** It is
  styled as not-product — dashed outline, literal DEMO tag — so no stakeholder
  reads it as a shipping feature. In the real product a person simply has the
  permissions they have. It swaps which tabs exist and who the top bar claims
  to be.
- **Each role's tab set is complete on its own.** Tabs the current role cannot
  use are hidden, not disabled, so the demo never advertises a surface the
  person could not reach.
- **No Design Toolbox.** This mock is a demo artifact rather than a review
  artifact, so the toolbox include is omitted entirely rather than included and
  disabled — that leaves no dead override. If review comments are wanted later,
  add the standard include back to `ver1/index.html`:
  `<script src="../../../../designtoolbox/toolbox.js?v=1.1.0"></script>`
- **State is in memory.** Reload the page to reset the demo.
- **Dates are pinned** to a demo "today" of 2026-10-05 so queue ages stay stable.

### A good 3-minute demo path

1. **Requester** — *My Assigned Items*. Point out the turnout pants flagged
   damaged and the particulate hood flagged overdue: the condition is what makes
   the next action obvious.
2. Click **Request replacement** on the pants. Note the form pre-fills the size
   and the damage note from the item itself, and that the reason picker offers
   only what makes sense.
3. **Submit** → land in *My Requests*, see it as Pending approval.
4. Switch to **Approver**. The queue leads with who and how long they've waited.
   Open **Review**, try **Deny** with no note (it blocks), then **Approve**.
5. Switch to **Store Room**. Open **Issue** — read the assignment-change
   sentence aloud; that is the model. Confirm.
6. Back to **Requester** → *My Requests* → **View** shows the full timeline with
   the approver's note.

---

## 4. The architecture it inherits

Shell, tokens and component discipline come from
`products/check-it/Checklist-management/ver1/index.html`:

- The navy top bar and 233px white rail are a **recreation of shipped product
  chrome**, copied verbatim, `--ci-*` namespaced. Decorative — a developer is
  not rebuilding it. Only the active nav item moved (Inventory, expanded to
  show where this feature lives).
- The **content window is the new design**, and that is where Vector components
  do the work: `vaadin-tabs`, `vaadin-select`, `vaadin-text-field theme=outlined`,
  `vaadin-text-area`, `vaadin-dialog`, `vaadin-button`.
- Core **v1.22.3** / themes **v1.9.3**, light only.
- Status/reason pills are hand-rolled `.rq-status` / `.rq-reason` rather than
  `theme="badge"`, because each requisition status needs one hue carried across
  a badge, a timeline dot and a row accent. Worth revisiting at handoff.
- Segmented controls are plain buttons, not `vwc-toggle-button-group`, which
  behaves additively inside dialog renderers.
- Every `value-changed` handler compares before acting — the event fires once on
  component upgrade, and an unguarded handler that re-renders loops forever.

## 5. Verification done

Driven in real headless Chrome over CDP (not a static check — a stubbed DOM
passes while a page is broken by a Vaadin recursion):

- Full chain walked: request → submit → approve → issue, across all three roles.
- Deny-without-a-reason correctly blocks and messages.
- No console errors or uncaught exceptions.
- Zero invisible Font Awesome icons in any view (the silent-failure trap: an
  icon class not in the loaded set renders as a zero-width glyph with no error).
