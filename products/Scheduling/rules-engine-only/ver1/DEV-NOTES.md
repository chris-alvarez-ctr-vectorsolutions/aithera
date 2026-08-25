> date: 2026-08-25

<!-- Running notes, one section per flow-map node (## <node-id>). Each bullet is a
     change/decision made while building that screen. The flow map shows these per
     step (as "Notes" during design; they become "Dev notes" at handoff). A `> date:`
     line dates the notes below it; prefix a bullet with (YYYY-MM-DD) to override. -->


## setup — Step 1 · Entry (pick a rule to preview)
- Chat-free V1. Lean two-tab shell (**Rule setup** | **Preview**) instead of the full CallBack app — no outer sidebar / product chrome, no AI builder.
- The on-ramp into preview: choose one of the existing rules (real `RULES_DATA`), then **Preview ranking** (or the Preview tab) hands off. The mock boots here.
- Each rule row shows its name, description, and the approaches it applies to; AI-created rules carry a small "AI" chip. Selection is a single-choice radio.
- Reuses V2's data + ranking verbatim, so the predicted order on the next step is real.

## preview — Step 2 · Preview (chat-free simulator)
- The existing Preview Mode simulator with the **AI Chat** tab removed (`opts.noChat`): the left panel is just **Callback Settings** (approach, rule, shift date/time, operational filters), no tabs.
- Right side is the **preview + callback list**: the callback chain stepper over the **Predicted call order** (the ranked callback list), which updates as settings change. Generic hypothetical — nothing dispatched live.
- Seeded from the rule picked on the setup step (approach + rule pre-filled), so the call order populates on entry. **Reset simulation** clears it; the back arrow (or Rule setup tab) returns to the entry step.
