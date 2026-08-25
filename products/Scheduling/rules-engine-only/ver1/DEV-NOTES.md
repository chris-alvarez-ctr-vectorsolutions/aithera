> date: 2026-08-10

<!-- Running notes, one section per flow-map node (## <node-id>). Each bullet is a
     change/decision made while building that screen. The flow map shows these per
     step (as "Notes" during design; they become "Dev notes" at handoff). A `> date:`
     line dates the notes below it; prefix a bullet with (YYYY-MM-DD) to override. -->


## firstSetup — Step 1 · First setup (no approaches yet)
- Fresh-account empty state of the Approaches & Rules page (flow version `v1`). "Getting started" guide sits on step 1 of 3, "Create approaches" active.
- Approaches list shows the empty state: "No approaches yet — let's create your first one" with a **+ Add New Approach** CTA.
- Rules section is deferred here: copy reads "You'll set these up after you've created your approaches above."
- Dev: this is the SAME page component as the entry (step 2) — the only difference is `hasApproaches() === false`. Build one page with empty/populated states, not two pages.

## approaches — Step 2 · Entry (approaches exist → create first rule)
- Entry point the mock boots into (flow version `v2`). "Getting started" guide advances to step 2 of 3, "Create rules" active.
- Approaches list is populated; Rules list shows "No rules yet — let's create your first one" with a **+ Add New Rule with AI** CTA.
- Methodology accordion ("How does callback ranking work?") is open by default and lays out the five ranking steps.

## builder — Rule Builder (Add New Rule with AI)
- Full-bleed dual-screen builder (the app shell chrome is hidden). Left = guided AI chat; right = live "Rule configuration" panel that fills in as the chat progresses.
- Entered from the entry screen's **+ Add New Rule with AI**; **Back** returns to Approaches & Rules.
- Six rule types drive different config fields: Standard Rolodex, Accumulating Rolodex, Accumulation — Hours Based, Static — Seniority, Static — Employee ID, Random / Lottery.
- On completion the assistant offers **Save rule / Preview ranking / Adjust something**.

## preview — Preview Ranking (simulator)
- Full-page "Preview Mode — Rule Simulator", reached via **Preview ranking** (also embeddable as a right-panel view inside the builder).
- Left = Callback Settings (pick approach + rule, shift date/time, filters); right = predicted call order that updates as inputs change.
- Generic hypothetical — nothing is dispatched live. **Reset simulation** clears it.
