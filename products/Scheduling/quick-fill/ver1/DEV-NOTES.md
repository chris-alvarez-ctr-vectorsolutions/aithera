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
- **Compact rows:** one short row per person: rank, name + phone, the rule's data, Fill. The rule's data sits on the right so cards stay short. This follows the crew scheduler feedback: people don't want to scroll up and down a lot.
- **Rule-specific data:** each card shows only the data point the current rule ranks on, not every factor for every rule type.
- **Approach and Rule on the header:** the two dropdowns sit on the panel header, sized up (14px bold values) so it's easy to see what the list is ranked by. A **Default** tag sits after them while both are on their defaults; when either changes, it becomes a **Reset to default** link.

> date: 2026-10-13

- **Hire date replaces the tiebreaker:** the hire date and the tiebreaker are the same thing, so there is one line, under the rule value: "Hired 3/14/2011". The separate tiebreaker line is gone. The (1)/(2) numbers can be hidden with Filter › Show tiebreaker.
- **Same hire date → (1), (2):** when two people share a hire date, each has a tiebreaker number, and the lower number ranks first: "Hired 3/14/2011 (1)", "Hired 3/14/2011 (2)".
- **When the number shows:** only when it actually decides the order, i.e. the two people sit next to each other in the ranking, are tied on the rule value AND share the hire date. Otherwise only the date shows. For example, Whitaker and Lindqvist share a hire date, but under Overtime - Hours Based they aren't tied (18.00 vs 34.00 hrs), so neither shows a number. Under Turns Based they tie at 1 turn, so both do.
- **Tie order:** ties on the rule value break by earlier hire date first, then by the lower tiebreaker number.
- **Demo pairs:** the mock has a pair for each rule that can tie. In Overtime - Hours Based, Ferraro (1) and Okonjo (2) are both at 12.50 hrs and hired 3/14/2011. In Turns Based, Whitaker (1) and Lindqvist (2) are both at 1 turn and hired 1/20/2009.
- **Rank numbers include excluded users:** the ranking is computed over everyone the approach covers, including excluded users. The available list therefore skips their numbers (e.g. 1, 2, 3, 5 when #4 is on PTO). The footer explains that missing numbers are excluded users.

## rule

- **Rules named by sorter type:** Hours Based, Rolodex, Turns Based, Accumulating Rolodex, so the type is easy to tell apart.
- **Card data per type:**
  - Hours Based shows OT hours.
  - Rolodex shows "Rank #N" (rotation position).
  - Turns Based shows turns.
  - Accumulating Rolodex shows "Rank #N" plus hours accumulated toward the 24 h limit. People at the limit drop to the bottom.

## excluded

- **Excluded users list:** below the ranked list, show who the approach excluded and why (time off, working another shift, opted out), the same way the callback preview does. The "N excluded" summary in the count bar jumps to this list.
- **Excluded users keep their rank number:** each excluded row shows its number (dashed badge) so schedulers can read the actual full ranking. For example, #4 Rachel Moreno is on vacation, which is why the available list jumps from 3 to 5.

## search

> date: 2026-10-13

- **Search + Filter on one line:** the search bar takes the width, with the Filter button beside it. This is the same at every screen size.
- **Name search:** the search bar filters the list by first or last name as you type, and highlights the matching text. It searches the excluded users too, so a scheduler can see why someone they're looking for isn't on the list. If nobody available matches, an empty state says so and points to any excluded matches.
- **Search doesn't change the ranking:** rank numbers never change; search only hides rows.
- **No Sort:** the Sort control was removed. The list always shows rank order.

## filter

> date: 2026-10-13

- **Filter panel:** the Filter button (sliders icon) opens an inline panel with **Qualifier** toggle chips (Driver/Operator, Hazmat Tech, Rescue Tech). The earlier A/B/C Shift group filter was removed.
- **Filter logic:** a person matches if they have ANY of the selected qualifiers.
- **Show tiebreaker switch:** this switch in the Filter panel turns the (1)/(2) tiebreaker numbers after shared hire dates on or off. It's on by default. The hire date itself always shows; the ranking order doesn't change either way. Turning it off counts toward the Filter badge, and Clear filters turns it back on.
- **Filtering doesn't change the ranking:** filters only hide rows, and they apply to the excluded list too. Rank numbers never change.
- **Apply:** a right-aligned **Apply** button closes the panel. Changes preview live in the list while the panel is open.
- **Badge and Clear filters:** the Filter button shows a count of selected chips. When any chips are selected, a **Clear filters** link appears in the count bar ("Showing 1 of 8 available · Clear filters"), outside the panel.
- **Approach and Rule are not in Filter:** they're the dropdowns on the panel header.
