# Partner Form Signing: Dev notes

Follow-up to **Workflow Enhancement** (VPATH-16031) for the **business partner** user type. On the 2026-10-22 PRD review call (Marivette Castree, Bob Peacock, Amrapali Sapkale, Sameer Mohanty), Bob showed the live partner portal: a slimmed-down view with only the partner's experiences. Partners have no dashboard, approvals or Manage Forms, so the admin's Workflow Tracking table and Signatures tile have nowhere to live. Bulk signing is in scope for partners, so it needs a home in their portal. Marivette: "this is a completely new mock-up" for that user type, and no epics for it until it's designed.

Two placements to compare at the next sync:
- **V1 Form Approvals page** (Marivette's idea): a new nav item and page holding a stripped-down version of the admin table.
- **V2 Sign from My Experiences** (Bob's idea): a Forms to sign column on the existing My Experiences rows, opening a drawer per experience.

**Guiding rule from the call:** anything the PRD doesn't call out as changing keeps today's behavior. The signing step is the same as the admin's in Workflow Enhancement.

> date: 2026-10-27

## all
- **Partners don't define forms:** the admin builds the workflow and its forms; each student placed in the partner's experience gets that workflow, and the form reaches the partner in their turn. An experience can have more than one workflow.
- **Only forms that have reached the partner:** waiting on them, signed by them (Signature sent), or Completed. Forms still with earlier signers don't show yet. No admin actions anywhere: no Resend email, Edit signers, Start or schedule, District or Grade columns.
- **Partner portal shell is a placeholder:** there's no screenshot of the live portal yet, so the left nav and the My Experiences columns are stand-ins. Swap in the real ones before handoff.
- **Email and no-login page stay as today:** partners still get the approve/reject email, and its buttons still open the no-login comment screen. This mock adds a signed-in way to sign; it doesn't replace the email. Bob is sending screenshots of both.
- **Rejected marker:** keep today's red "rejected" marker wherever a form's signers are listed. Not drawn yet; waiting on Bob's screenshot.
- **Completed retention is still open:** "Last 6 months" is a placeholder. Bob suggested a rolling year back from today, so the current school year and any trailing summer stay visible; Marivette is checking the customer expectation with Kara.

## exp
- **V1 banner and nav count:** My Experiences shows a banner with the number of forms waiting on the partner, and the Form Approvals nav item shows the same count. Both disappear at zero.
- **V2 Forms to sign column:** experiences with forms waiting on the partner show Sign (n). Experiences with nothing waiting show what they already signed there, or a dash.

## approvals
- **Cards:** Waiting on you · Signature sent · Completed. There are no All workflows or Waiting for signatures cards, because the partner only sees forms that have reached them.
- **Row actions:** every row has View (signer timeline). Rows waiting on the partner add Sign. Any row can be selected; Sign & approve (n) signs the selected forms waiting on them.

## selected
- **Same form only:** one signature goes on several students' copies of the same form, across experiences. If the selection mixes forms, the bar offers one button per form, as in the admin table.

## drawer
- **Bulk inside one experience only (V2):** one tab per form waiting on the partner, every student selected to start. A partner with the same form waiting in three experiences signs three times. That's the main trade-off against V1.
- **Signed by you (V2):** forms already signed in this experience, read-only. V2 has no cross-experience history.

## review
- **Approve / Reject:** same two options as today, and Reject needs a comment, as it does today.
- **Signature:** ink (drawn), as today. Typed signatures are out of scope.
- **Bulk confirmation:** the "my signature applies to each of them" checkbox only appears when signing more than one form.

## cosign
- **Shared signing order:** today two signers can share an order, and both get the email at once. The partner can still open View while it's their turn.
