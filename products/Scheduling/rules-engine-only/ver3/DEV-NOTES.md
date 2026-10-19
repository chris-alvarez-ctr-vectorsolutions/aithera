> date: 2026-10-19

<!-- Running notes, one section per flow-map node (## <node-id>). Each bullet is a
     change/decision made while building that screen. Notes render only in the
     dev_handoff.html build. V3 = V2's flows and copy, restyled after "2 · Full —
     the Builder" from the Reusable AI Chat Component explorations. -->


## builder — Step 1 · Entry (rule builder, blank)
- **Builder styling.** Public Sans, cool-gray neutrals, and one flat accent (#2D5BE3) with a 9% tint and 30% soft border. No gradients. Vaadin components pick up the same accent through the Lumo variables.
- **Three panes under one header.** A full-width Vectoria header (new conversation, history, "Exit to Approaches & Rules") sits above chat | Rule parameters | live preview. The host nav (icon rail + top bar) stays; only the CallBack sub-nav gives way. Below 1200px the preview folds back into a "Preview ranking" tab beside the parameters, as in V2.
- **Chat.** Context chips at the top show what Vectoria can see (approaches, attached files; removing one removes it from the rule). Square avatar tile, gray user bubbles, answer chips as wrapping pills. The composer has attach and voice on the left and a square send on the right; Start over moved to the header.
- **Direct edits are system notes.** Changing a parameter by hand adds a one-line "You set <field → value>" note in the thread instead of a chat bubble.
- **Reference card.** The reply after a chat-driven change carries an "Updated in Rule parameters" card listing the fields it changed, who's next up, and the preview version. Clicking it flashes the parameters and preview panes.
- **Parameter cards show provenance.** Every parameter is a card. A sparkle means Vectoria set it from chat, a person means you did, and "Required" marks Rule name, Rule affects, and Rule type. The newest change is tinted with an accent bar on the left.
- **Ghosted suggestion.** When the rule can be previewed, the next unset of Tiebreaker → Decline action → Notification channel shows a dashed "Suggested:" card with Accept / dismiss. Accepting applies it as a Vectoria-set value and logs a note.

## preview — Step 2 · Preview (live call order)
- **Preview pane = the Builder's preview canvas.** Its header shows the rule name, Draft, a version chip that goes up with every change, Reset, and **Save rule** (the Builder's Publish). Below it: rule summary, Callback Settings, and the predicted call order, which re-renders on every parameter change and keeps its scroll position.
- **Empty canvas first.** On a blank rule the pane shows a ghost list ("The predicted call order lands here") until a parameter is set.
- **Sources strip** under the call order: roster, callback history, lookback, filters, and "hypothetical, nothing dispatched."
- "Preview ranking" in chat points at the pane, and the reply names the same first person the pane shows.
