# Quick Fill — Dev notes

> date: 2026-10-06

Decisions from the 2026-10-06 review with Michael Fulton and Treva Aguinaga.

## modal

- **Entry point:** a dedicated **Quick Fill** button on the "Choose employee(s)" label row, right-aligned to where the input box ends. It's a real button, not a dropdown option, so it's obvious.
- **Desktop vs mobile:** desktop opens the Qualified Personnel **side panel** beside the modal; mobile opens it as a **pop-up** instead. A physical button makes it easy to give the two their own experiences.
- **Responsive breakpoints (built into the mock; resize the browser to see them):**
  - **≥1141px:** the panel docks beside the modal and narrows fluidly from 560px to 400px.
  - **761–1140px (tablet):** works like mobile, just wider. The form goes full screen (it keeps its two columns), and Quick Fill opens a bottom-sheet pop-up that's centered, up to 820px wide and 85% of the screen height. Tapping Fill closes the sheet.
  - **≤760px (mobile):** the form goes full screen in one column, and the bottom sheet spans the full width at 92% of the screen height, with a grab handle. Tapping Fill closes the sheet so the chosen person shows in the form.
  - **Closing the overlay:** on tablet and mobile, tapping the dimmed background or pressing Esc closes it.

## panel

- **Full name:** show both first and last name. Agencies sometimes put a rank number in the first or last name, so schedulers need to see both.
- **Phone number is required** on every candidate row.
- **Position removed:** the old "Position N" line was carried over from an earlier mock and isn't needed.
- **Compact rows:** one short row per person (rank, name + phone, rule data, Fill). The rule's data point sits on the right so cards stay short. This follows the crew scheduler feedback: people don't want to scroll up and down a lot.
- **Rule-specific data:** each card shows only the data point the current rule ranks on, not every factor for every rule type.
- **Hire date always shown:** every card shows the person's hire date next to the phone number ("Hired 3/14/2011"), for every rule type.
- **Tiebreaker shown:** when a row ties a neighbour on the rule's value (e.g. both at 12.50 OT hrs), the seniority date that broke the tie shows under the metric ("tie · sen. 3/14/2011"). Seniority date is usually the hire date, but not always (rehires), so it is labelled separately. Only tied rows show it. The **Show tiebreaker** switch lives in **Advanced filters** (see below) and turns it on or off (on by default). Michael: "the tiebreaker has value". Production's callback list shows it the same way.

## rule

- **Rules named by sorter type:** Hours Based, Rolodex, Turns Based, Accumulating Rolodex, so the type is easy to tell apart. Card data per type: Hours Based shows OT hours; Rolodex shows rotation position; Turns Based shows turns; Accumulating Rolodex shows position plus hours accumulated toward the limit.

## excluded

- **Excluded users list:** below the ranked list, show who the approach excluded and why (time off, working another shift, opted out), the same way the callback preview does. The "N excluded" summary in the count bar jumps to this list.

## search

> date: 2026-10-13

- **Name search:** a search bar under the Approach/Rule pickers filters the list by first or last name as you type, and highlights the matching text. It searches the excluded users too, so a scheduler can see why someone they're looking for isn't on the list. If nobody matches, an empty state says so and points to any excluded matches.
- **Sort:** the Sort menu changes the order shown: Rank (call order, the default), Last name (A–Z), Hire date (oldest first), Hire date (newest first), Auto-accept first.
- **Rank badge keeps call order:** whatever the sort, the # badge always shows the rule's call order, so re-sorting never hides who gets called first. The count bar reads "sorted by … · # = call order" whenever the sort isn't Rank.
- **Search and sort don't change the ranking:** they only filter and reorder the view. The rules engine order is untouched.

## advanced

- **Advanced filters:** the Advanced button (sliders icon) opens an inline panel under the toolbar, styled like the Approach/Rule menus. Only one of these three panels is open at a time.
- **Show tiebreaker switch:** the switch now lives here instead of on the picker row. For Rolodex rules it stays visible but disabled, with a note saying those rules don't produce ties.
- **Count badge:** a small badge on the Advanced button shows how many advanced options are on.

