# Build notes — Requisition Workflow (POC)

**Mock:** `ver1/index.html` · *Created 2026-10-05 · Grounded against the shipped product 2026-10-09*

This prototype was built **before a PRD existed**, on purpose. It is a
stakeholder buy-in POC meant to show *how we might approach* personal-issue
requisitions — not a specification of how they will work.

Everything below exists so the prototype can be shown without being mistaken
for a decision. Section 2 is the important one: it lists the rules the mock
deliberately does **not** model, so a stakeholder seeing a clean demo does not
assume those questions are settled.

---

## 0. Grounded against the real product (2026-10-09)

The first draft was built before seeing the shipped screens and got the
Inventory domain wrong. Two screenshots corrected it, and the mock was
restructured:

**Inventory is a catalog of item TEMPLATES, not a stock or tracking surface.**
It defines what a thing *is* and is instantiated by other areas of the system.
It carries no quantity and no store-room location. The first draft showed
"12 in stock · Main Store Room" on every catalog card — that misrepresented
the domain and is gone. Availability now lives in a separate `STORE_ROOM`
lookup, surfaced only to the fulfiller, where it actually belongs.

**Today, real inventory is only ever displayed scoped to a COMPARTMENT.** The
real Inventory sub-nav is Tools / Medical Supplies / Drugs / Compartments.
Those four are reproduced verbatim in the rail. **"Catalog" is the one new nav
item this POC proposes** — a browsable list of inventory items that is *not*
scoped to a compartment, so a person can find a thing, open its detail, and
request one. It is tagged `NEW` in the rail so a stakeholder can tell a
proposal from a recreation at a glance.

**The requester's home is the shipped Home > My Responsibilities table**, not a
new section. It keeps the product's own columns — Name, Pool Name (Type),
Location, Serial No, End of Life, Status — and adds exactly two things this
workflow needs: a **Condition** column and a row action. The story is "your
Home screen, with one new column," not "here is a new area."

Fields adopted from the real screens, replacing invented equivalents:

| Real field | What it replaced | Why it matters |
|---|---|---|
| `Pool Name (Type)` | an invented `cat` ("PPE"/"Tools"/"Comms") | Pools are the real template concept; type is PPE / STANDARD. |
| `End of Life` | an invented `due` date | The product's own term, and what drives the renewal reason. Now a date on the item, with due/overdue **derived** from it rather than stored, so the two can never disagree. |
| `Status` ("In Service") | — | The shipped item status, kept as a **separate axis** from condition. |
| `Location` = a person's name | an invented `assignmentId` relation | **Assignment is already modelled as location.** Issuing an item writes a person's name into Location — which is why the fulfiller dialog states the transfer in words. |

**Condition is deliberately a separate axis from Status.** An item can be
damaged and still In Service — the torn turnout pants are being worn right
now, which is exactly why a replacement is being requested. Collapsing the two
would make the mock claim that flagging damage takes a thing out of service,
which is a policy decision nobody has made. Status is the department's call;
condition is what the person wearing it reports. **This needs confirming.**

---

## 1. The model the mock proposes

The one real proposal here is the **shape of the data**, because it is what
makes the three entry points one feature rather than three.

A requisition is **a request to change an assignment** — and since assignment
*is* Location on the real screen, issuing one rewrites that field. It points at
a pool (the template) and, when replacing, at the specific assigned item:

```
requisition {
  id, requester, unit,
  poolId,               // which pool/template is wanted
  itemId | null,        // the assigned item being replaced (null for 'new')
  reason: 'replace' | 'new' | 'renewal',
  detail, size, qty, neededBy,
  status: 'draft' | 'submitted' | 'approved' | 'denied' | 'issued',
  history: [ { at, by, action, note } ]
}
```

Consequences visible in the mock and worth confirming with stakeholders:

1. **The entry point is the Home table you already have.** Condition is what
   makes the next action obvious — the damaged pants carry the button.

2. **Reason is a property of one act, not three different acts.** Replacement,
   new issue and scheduled renewal share one form; the reason changes which
   fields it asks for (photo and "what happened?" for damage, justification for
   a new issue, neither for a renewal).

3. **Only reasons that make sense are offered.** You cannot "replace" something
   never issued to you, so a catalog request for an unheld pool offers only
   *New issue*. Opening a pool you already hold offers **Request a
   replacement** and starts from your item, not a second one.

4. **Issuing rewrites the assignment.** The fulfiller's confirm dialog says so
   in words, and the confirm actually writes `location`, a new `serial`, a
   recomputed `endOfLife` (a fresh unit restarts the clock) and resets
   `condition`. The row on My Responsibilities changes in front of you.

5. **An item with an open request does not offer a second one.** The row shows
   the live request status instead, as a link to it.

## 2. Deliberately NOT modelled

These are unanswered questions, not oversights. The mock shows *a* behaviour
where it needed one to be legible; none of it should be read as a decision.

| Area | What the mock does | What is actually undecided |
|---|---|---|
| **Approval routing** | One approver ("your company officer") decides everything. | Whether approval is one step or several; whether value, item class or reason changes the route; who approves when the officer is the requester. |
| **Approval thresholds** | Every request needs a human decision. | Whether renewals auto-approve on the due date, and whether low-value consumables need approval at all. The requester-facing routing note *says* renewals "are usually approved automatically" — that sentence is illustrative placeholder copy. |
| **Stock & reservation** | Lives in a separate `STORE_ROOM` lookup — NOT on the pool, since Inventory carries no quantity. Shown only to the fulfiller; decremented on issue. Zero stock disables the Issue button. | There is no reservation model. Nothing holds stock between approval and issue, so two approved requests can both claim the last unit. Where this data really lives (Store Rooms? compartments?) is unresolved. |
| **Entitlement rules** | Renewal is driven by the item's **End of Life** date; "due" is derived when it is within 180 days. | That 180-day window is invented. What sets End of Life per pool, whether entitlement is per-person or per-rank, and what happens to an item past end of life but still In Service. |
| **Cost / budget** | Absent entirely. | Cost centres, charge-back to a unit, budget limits as an approval input. |
| **Returns & disposal** | The old unit is "returned and taken out of service" in copy only. | Whether a return is its own tracked step, who confirms receipt, what happens to serviceable returned gear. |
| **Lost / stolen** | Not built. | Deliberately out of scope for the POC — it carries accountability rules nobody has defined, and showing it half-built invites the wrong conversation. Expect it to be raised; it is a known gap, not an omission. |
| **Notifications** | None. | Whether the requester is notified on decision/issue, and through what channel. |
| **Quantity** | Capped at 3 in the picker. | Arbitrary. Whether a personal-issue request can ever be bulk is an open question. |
| **Sizes** | A flat list on the pool. | No size profile on the person, so size is re-picked every time. A stored profile is an obvious improvement nobody has specified. |
| **Condition** | A new field, separate from Status, reported by the holder. | Does not exist in the product today. Who can set it, whether it affects Status, and whether it belongs on the item or only on a requisition are all open. |

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

1. **Requester** — *My Responsibilities*. This is the shipped Home table with
   one new column. Point out the turnout pants flagged **Damaged** and the
   particulate hood flagged **Past end of life**: condition is what makes the
   next action obvious, and the two are independent (the hood is past end of
   life and in good condition).
2. Click **Request replacement** on the pants. The form pre-fills size and the
   damage note from the item, and the reason picker offers only what makes
   sense. (Or start from **Catalog** — the proposed new nav item — open an
   item's detail, and request from there.)
3. **Submit** → land in *My Requests*, see it as Pending approval.
4. Switch to **Approver**. The queue leads with who and how long they've waited.
   Open **Review**, try **Deny** with no note (it blocks), then **Approve**.
5. Switch to **Store Room**. Open **Issue** — read the assignment-change
   sentence aloud; that is the model. Enter a serial and confirm.
6. Back to **Requester** → *My Responsibilities*: the row now shows the new
   serial, a recomputed End of Life and a reset condition. *My Requests* →
   **View** shows the full timeline with the approver's note.

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
