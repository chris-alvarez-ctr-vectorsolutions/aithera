# Vector EHS — Prototyping Notes

## Layout & spacing defaults

Default spacing and canvas values for this product. Keep these consistent across screens; variation in padding between cards at the same hierarchy level is a common mistake to avoid.

- **Page padding:** content is inset **24px** from the screen edges (24px by 24px, all sides).
- **Card padding:** content inside a card defaults to **24px by 24px**. Cards at the same hierarchy level must use the same padding.
- **Canvas background:** cards and content sit on a **`#f5f9fd`** background.

## Section titles & text hierarchy

Give section / sub-section titles a clear, modern hierarchy. Do NOT default to ALL CAPS at the same size and color as the body content underneath it (a common mistake to avoid).

- A section title should read as a heading: sentence case, slightly larger or bolder than the body, and a darker heading color. Avoid uppercase + letter-spacing for content section titles.
- Reference treatment: title ~13px, weight 600, color `#1a1a2e`; body content ~12.5px, weight 400, color `#374151`.
- Keep it subtle, not obtrusive: the title should be distinguishable from the body without shouting.

## Labels & casing

All label-like text uses **sentence case** — never all caps. This covers form field labels, section / sub-section labels, step indicators, and the small inline tag/status chips.

- Do **not** apply `text-transform: uppercase` (or `letter-spacing`-driven caps) to any label, field title, step indicator, or tag chip. This styling has been removed across the EHS mobile prototypes (`Mobile App - main.html`, `Mobile App - blue sky.html`).
- Author the text the way it should read: "Search users", "Report type", "Step 1" — not "SEARCH USERS" / "STEP 1". Don't reintroduce caps in the markup either.
- Genuine acronyms (JSA, EHS, PPE, ID) stay uppercase because that is their correct spelling, not a styling choice.

## AI / Smart Recommendations rule

When building any AI-powered or "smart" recommendation surface in EHS prototypes:

- **Do not** add a "Vector AI" badge, pill, or other AI branding to the UI.
- **Do not** add overtly AI-themed styling such as multi-color gradient stripes, "Powered by AI" labels, sparkle-icon chrome, or purple/violet brand accents that read as an "AI module."
- The module should look like a normal recommendation / suggestion surface that happens to be intelligent — title it for the function (e.g. "Recommended Actions", "Suggestions") rather than for the technology.
- Functional behavior (data-driven triggers, dismissibility, replacement on dismiss, etc.) is unaffected — only the branding/styling is restricted.

This rule applies to every AI feature added to EHS prototypes from this point forward, unless the user explicitly says otherwise.
