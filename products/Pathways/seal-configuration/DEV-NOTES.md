# Seal Configuration: Dev notes

The NY Seal of Civic Readiness setup page (Data Center › Review Data › Civic Seal), as it is on staging, plus the three items Kara Pontius raised on 2026-10-26: VPATH-18384, VPATH-18385 and VPATH-18386.

> date: 2026-10-27

## page
- **Starting point:** matches the staging page from 2026-10-27. Everything not listed in these notes keeps today's behavior.
- **High School Civics Project is repeatable (VPATH-18384):** mark it Repeatable, 1.5 pts each, max 3 pts (2 completions in grades 9–12). Staging shows it unmarked, so students and admins can't record it twice.
- **Points column:** a repeatable criterion shows "<n> pts each", the Repeatable tag, and its max ("Max 3 pts · up to 2 times", or "No max").
- **Criteria below the fold:** the staging screenshots stop at Middle School Capstone Project. "Extracurricular Participation" (0.5 pts, repeatable) stands in for the extracurricular criterion Kara mentions; confirm its real name and points.

## edit-civics
- **Edit points (new):** each criterion gets Edit points, opening an inline box under it: Points per completion, a Repeatable switch, and Max points per student (repeatable only). Save and Cancel; nothing changes until Save.
- **Helper line:** says what the numbers allow, e.g. "Students can earn this up to 2 times (3 pts)." Save is disabled when the max is less than one completion.

## edit-max
- **District max (VPATH-18386):** admins set the max points for any repeatable criterion, since districts differ (Kara's example: one district allows 6 pts of extracurricular, another 1). Empty means no max.
- **Open question:** is the max set once per district (this page is district-wide), or does it need to differ by school? Kara's ticket says "not every school allows the same amount".

## not-multiple
- **Max that isn't a multiple:** if the max can't be reached exactly (3.5 with 1.5 each), the helper warns how many completions that allows and what's left over. It's a warning, not an error, so the admin can still save.

## link
- **Linking (today):** the link panel is unchanged: search badges and activities, set points (defaults to the criterion's), click a result to add it.
- **Each completion counts (VPATH-18385):** today a linked badge earned with two completed activities only counts once (1.5 pts instead of 3). On a repeatable criterion, every completion of a linked badge or activity should count, up to the max. The link panel says so in one line. This is mostly a calculation fix on the dashboard.
