# Workflow Enhancement: Dev notes

Two versions: **V1 Admin** holds every admin piece (#3–4 tracking + bulk signing, #5–6 edit signers, #7 start or schedule, with 7.5). **V2 Business Partner** is the same table from the partner's side.

Decisions from the PRD review call with Marivette Castree, Bob Peacock, Amrapali Sapkale and Sameer Mohanty.
**Guiding rule from the call:** anything the PRD doesn't call out as changing keeps today's behavior, even where the mock looks different. If a mock detail conflicts with today's product and isn't in the PRD, build today's version and flag it.

> date: 2026-10-22

## all
- **Statuses:** Waiting for signatures · Signature sent (the signed-in user has signed and the form moved on to its next signer; this is per user) · Completed <date> (every signer is done) · Sending out <date> · Start workflow (#7 only).
- **Waiting on you is a filter, not a status:** it overlaps the other cards, so the card counts don't add up to All workflows. That's intended.
- **Completed retention is still open:** the mock keeps completed workflows for 6 months as a placeholder. Marivette is checking the customer expectation with Kara (school year? since the district started?).
- **No stalled indicator in this release:** today the product has no definition of "stalled". The shelved build used 14 days for every district, and a per-district setting would add scope. Admins see who the form is waiting on, and when it was sent, in the details panel. Unsigned pending workflows still go inactive after 14 days, as today.
- **Rejected signers:** keep today's red "rejected" marker from the per-student view in this table too. It isn't drawn in the mock yet; Bob is sending a screenshot of today's marker, the approve/reject email and the comment screen.
- **Row actions:** every row opens its details, including when the user is up next to sign, alone or sharing a signing order with someone else. Rows waiting on the user also get a Sign button. V1 is trying a whole-row click with a chevron at the far right instead of a View link (V2 still uses View); pick one before handoff. The checkbox, Sign, the Start workflow badge and the student name keep their own actions.

## drawer
- **Resend email:** this is today's resend from the per-student screen, brought into the details panel. It is not a new reminder system. It goes to everyone the form is waiting on except the signed-in user.
- **Shared signing order:** today two signers can share an order, and both get the email at once. The panel shows both as Waiting, and Resend email works even while it's also the user's turn.

## review
- **Approve / Reject:** same two options customers get today (not "Do not approve"). Reject requires a comment, as it does today.
- **Signature:** ink (drawn) signature, as today. Typed signatures are out of scope because signatures display across the product.
- **Bulk confirmation:** the "my signature applies to each of them" checkbox only appears when signing more than one form. A single form signs as today.

## mine
- **Business partner view (V2):** partners see only forms they sign, for students placed with them, and only after a form has been sent out (no Sending out or Start workflow). Same statuses, View + Sign and bulk signing as V1. No admin actions: no dashboard tile, Resend email, Edit signers, Start/schedule or District column.
- **Partner portal shell is a placeholder:** we don't have a screenshot of the live partner portal yet, so V2's left nav is a stand-in. Whether partners sign in at all (vs. only the email + no-login page Bob described) is still open with Marivette.
