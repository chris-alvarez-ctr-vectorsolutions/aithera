# Quick Fill — Dev notes

> date: 2026-10-06

Decisions from the 2026-10-06 review with Michael Fulton and Treva Aguinaga.

## modal

- **Entry point:** a dedicated **Quick Fill** button on the "Choose employee(s)" label row, right-aligned to where the input box ends. It's a real button, not a dropdown option, so it's obvious.
- **Desktop vs mobile:** desktop opens the Qualified Personnel **side panel** beside the modal; mobile opens it as a **pop-up** instead. A physical button makes it easy to give the two their own experiences.
- **Responsive breakpoints (built into the mock; resize the browser to see them):**
  - **≥1141px:** the panel docks beside the modal and narrows fluidly from 560px to 400px.
  - **761–1140px:** not enough room beside the modal, so the panel becomes a right-side drawer over a dimmed page.
  - **≤760px:** the modal goes full screen in one column, and Quick Fill opens a bottom-sheet pop-up (92% of the screen height, with a grab handle). Tapping Fill closes the sheet so the chosen person shows in the form.
  - **Closing the overlay:** in drawer and sheet modes, tapping the dimmed background or pressing Esc closes it.

## panel

- **Full name:** show both first and last name. Agencies sometimes put a rank number in the first or last name, so schedulers need to see both.
- **Phone number is required** on every candidate row.
- **Position removed:** the old "Position N" line was carried over from an earlier mock and isn't needed.
- **Compact rows:** one short row per person (rank, name + phone, rule data, Fill). The rule's data point sits on the right so cards stay short. This follows the crew scheduler feedback: people don't want to scroll up and down a lot.
- **Rule-specific data:** each card shows only the data point the current rule ranks on, not every factor for every rule type.
- **Tiebreaker shown:** when a row ties a neighbour on the rule's value (e.g. both at 12.50 OT hrs), the seniority date that broke the tie shows under the metric ("tie · 3/14/2011"). Only tied rows show it. Michael: "the tiebreaker has value". Production's callback list shows it the same way.

## rule

- **Rules named by sorter type:** Hours Based, Rolodex, Turns Based, Accumulating Rolodex, so the type is easy to tell apart. Card data per type: Hours Based shows OT hours; Rolodex shows rotation position; Turns Based shows turns; Accumulating Rolodex shows position plus hours accumulated toward the limit.

## excluded

- **Excluded users list:** below the ranked list, show who the approach excluded and why (time off, working another shift, opted out), the same way the callback preview does. The "N excluded" summary in the count bar jumps to this list.
