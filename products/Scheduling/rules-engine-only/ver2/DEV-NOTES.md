> date: 2026-08-25

<!-- Running notes, one section per flow-map node (## <node-id>). Each bullet is a
     change/decision made while building that screen. The flow map shows these per
     step (as "Notes" during design; they become "Dev notes" at handoff). A `> date:`
     line dates the notes below it; prefix a bullet with (YYYY-MM-DD) to override. -->


## builder — Step 1 · Entry (rule builder, pre-filled)
- **Lands pre-filled.** The mock boots straight into the dual-screen AI rule builder with a complete rule already configured ("Overtime - Hours Based" applied to Firefighter 2 + Captains), so the author is one click from previewing — no need to build a rule first.
- **Preview entry sits by Save, on both sides.** Once the rule has enough set (`minInfoComplete()`), a secondary **Preview ranking** button appears stacked on top of the Cancel / Save Rule row on the configure side, and as the first **Preview ranking** chip on the chat side. (The banner's "Preview Mode" toggle still works too.)
- Otherwise identical to the standard AI builder — the guided chat on the left, the live rule configuration on the right.

## preview — Step 2 · Preview (chat-free ranking simulator)
- Clicking any Preview entry drops the chat entirely and takes over the screen with the **chat-free** ranking simulator (`opts.noChat`): **Callback Settings** on the left (approach, shift date/time, operational filters); the predicted **call order** — the callback list — on the right, updating as inputs change.
- Seeded from the rule in the builder, so the order populates immediately. Generic hypothetical — nothing dispatched live. **Reset simulation** clears it; the **Back** arrow returns to the builder.
