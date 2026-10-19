> date: 2026-10-19

<!-- Running notes, one section per flow-map node (## <node-id>). Each bullet is a
     change/decision made while building that screen. Notes render only in the
     dev_handoff.html build. V3 = V2's flows and copy, restyled after "2 · Full —
     the Builder" from the Reusable AI Chat Component explorations. -->


## builder — Step 1 · Entry (rule builder, blank)
- **Builder styling.** Public Sans, cool-gray neutrals, and one flat accent (#2D5BE3) with a 9% tint and 30% soft border. No gradients. Vaadin components pick up the same accent through the Lumo variables.
- **Three panes under one header.** A full-width Vectoria header (new conversation, history, "Exit to Approaches & Rules") sits above chat | Rule parameters | live preview. The host nav (icon rail + top bar) stays; only the CallBack sub-nav gives way. Below 1200px the preview folds back into a "Preview ranking" tab beside the parameters, as in V2.
- **Chat.** Context chips at the top show what Vectoria can see (approaches, attached files; removing one removes it from the rule). Square avatar tile, gray user bubbles, answer chips as wrapping pills. The composer has attach and voice on the left and a square send on the right; Start over moved to the header.
- **Rule parameters starts collapsed on a blank rule.** It sits as a rail between the chat and the preview, so the first move is answering Vectoria. It opens on its own the first time an answer fills in a parameter. That happens once: if the person collapses it again, it stays collapsed. "New conversation" / Reset collapses it again. Rules opened from a template, approaches, or an existing rule start with it open.
- **Direct edits are system notes.** Changing a parameter by hand adds a one-line "You set <field → value>" note in the thread instead of a chat bubble.
- **Reference card.** The reply after a chat-driven change carries an "Updated in Rule parameters" card listing the fields it changed, who's next up, and the preview version. Clicking it flashes the parameters and preview panes.
- **Parameter cards show provenance.** Every parameter is a card. A sparkle means Vectoria set it from chat, a person means you did, and "Required" marks Rule name, Rule affects, and Rule type. The newest change is tinted with an accent bar on the left.
- **Ghosted suggestion.** When the rule can be previewed, the next unset of Tiebreaker → Decline action → Notification channel shows a dashed "Suggested:" card with Accept / dismiss. Accepting applies it as a Vectoria-set value and logs a note.

## preview — Step 2 · Preview (live call order)
- **Preview pane = the Builder's preview canvas.** Its header shows the rule name, Draft, a version chip that goes up with every change, Reset, and **Save rule** (the Builder's Publish). Below it: rule summary, Callback Settings, and the predicted call order, which re-renders on every parameter change and keeps its scroll position.
- **Helper text before the preview.** Until Vectoria knows how the rule ranks people, the pane keeps the ghost list and adds helper text with nothing clickable. It reads "The preview will show up once you answer this question in the chat," followed by the current question in quotes, with a nudging arrow pointing at the chat (it points up on phones). A short "what the preview needs" list (Who the rule covers, How it ranks people) ticks off with values. In the thread, the question it refers to is set slightly larger (15px) with no box, and the rule-type picker sits inside that message. The arrow nudge is off when reduced motion is preferred. Once the rule type is set, the live call order replaces it.
- **Sources strip** under the call order: roster, callback history, lookback, filters, and "hypothetical, nothing dispatched."
- "Preview ranking" in chat points at the pane, and the reply names the same first person the pane shows.
