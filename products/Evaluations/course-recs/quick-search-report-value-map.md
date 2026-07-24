# Quick Search Report — Tracked & Stored Value Map

**Source repo:** `VectorLearning/teachpoint-web`
**Branch reviewed:** `integration/ui-modernization-v2-pd-tracking`

This maps every value involved in the **Quick Search** report that is launched from a form — the **inputs** (search criteria the user sets), the **output** columns/fields displayed in the results, and the **copy-to-clipboard** export. Unlike the Form Change Log (which reads a dedicated audit table), Quick Search is a *live query* — it does not store its own records; it aggregates existing `rubricdata`, `userdata`, attachment, and `tag` data at run time.

---

## 1. Where it lives

| Layer | File |
|-------|------|
| Launch point (form record-actions menu) | [`formrecbuttons.xhtml:167`](teachpoint-web/src/main/webapp/user/formrecbuttons.xhtml#L167) — menu item `form.record.actions.menu.quickSearch`, gated by `rubricbean.showQuickReportLink()` |
| Dialog | [`dialogquickreport.xhtml`](teachpoint-web/src/main/webapp/user/dialogquickreport.xhtml) — header `dialog.quickSearch.header`, "Generate Report" = `dialog.quickSearch.action.generateReport` |
| Filter panel (inputs) | [`reportfilter.xhtml`](teachpoint-web/src/main/webapp/user/reportfilter.xhtml) via [`ReportFilter.java`](teachpoint-web/src/main/java/teachpoint/userbeans/ReportFilter.java) |
| Backing bean | [`QuickReport.java`](teachpoint-web/src/main/java/teachpoint/reports/QuickReport.java) — `@Named("quickreport")`, view-scoped |
| Results table | [`quicksearch_table.xhtml`](teachpoint-web/src/main/webapp/sections/util/quicksearch_table.xhtml) |
| Result row model | [`QuickReportResult.java`](teachpoint-web/src/main/java/teachpoint/reports/data/QuickReportResult.java) |
| Report data container | [`QuickSearchReportData.java`](teachpoint-web/src/main/java/teachpoint/reports/data/QuickSearchReportData.java) |
| Data sources (DAOs) | `Userdata2DAO.getUserdataByRubricIds`, `RubricdataDAO.findTaggedData`, `Userdata2DAO.attachmentsByTagIds` |
| Labels | [`Messages.properties`](teachpoint-web/src/main/resources/teachpoint/i18n/Messages.properties) (keys `quicksearch.*`, `dialog.quickSearch.*`, `report.filter.*`) |

**Flow:** Menu item → `resetQuickSearchFilter()` sets defaults & feature type from the current form → user adjusts filters → **Generate Report** calls `searchByDialog()` → `setFiltersFromReportFilter()` → `search()` runs the queries and builds `List<QuickReportResult>` → `quicksearch_table.xhtml` renders them.

---

## 2. INPUTS — search criteria (what the user sets & what's tracked into the query)

Set on `QuickReport` / `ReportFilter` and carried into `search()` via a `ReportSpec`.

| Input | Field(s) | Type | Default (on open) | Feeds |
|-------|----------|------|-------------------|-------|
| **Date range type** | `dateType` | Int (`Districtpref` visible-data code) | `VISIBLE_DATA_CURRENT_YEAR` | `startDate`/`endDate` computation |
| **Start / End date** | `startDate`, `endDate` | Date | Derived from district year start + timezone | All queries (`created` range) |
| **Forms / rubrics** | `selectedFormIds` | List&lt;Integer&gt; | From forms filter for the report | `getUserdataByRubricIds`, attachment query |
| **Authors** | `selectedAuthorIds` | List&lt;Integer&gt; | Author list for target user(s) | `getUserdataByRubricIds`, attachment query |
| **Educators (target users)** | `selectedUserIds` / `viewableUserIDs` | List&lt;Integer&gt; | Current subject (`login.getSubjectId()`) | User scoping; resolved via `UserDAO.findByAdvancedFilters` |
| **Tags** | `selectedTagIds` | List&lt;Integer&gt; | none selected | Expanded via `TagTree` child nodes → `tagIds` → both queries |
| **Question types** | `selectedQuestionTypes` | List&lt;Integer&gt; (`Question.QTYPE_*`) | question filter list | `RubricdataDAO.findTaggedData`; attachment inclusion |
| **Data Elements** | `selectedDataElements` | List&lt;Integer&gt; | all 5 selected | Toggles which content categories are queried (see below) |
| **Feature type** | `featureType` | `Rubric.FeatureType` | Derived from the launching form's `featureSource` (else EVALUATION) | Scopes all queries |
| **Exclude self-authored** | `reportFilter.excludeSelfAuthored` | boolean | `false` | Author scoping |

### Data Element codes (`report.filter.label.dataElements.*`)
| Code | Label | Effect in `search()` |
|------|-------|----------------------|
| 1 | Question Data | `findTaggedData(... includeQuestionData ...)` — question answers |
| 2 | Question Attachments | `attachmentsByTagIds(... questionAttachments=true ...)` |
| 3 | Form Attachments | `attachmentsByTagIds(... formAttachments=true ...)` |
| 4 | Annotations | `findTaggedData(... includeAnnotations ...)` |
| 5 | Uploaded Files | `attachmentsByTagIds(... uploadedFiles=true ...)` |

---

## 3. OUTPUT — result table columns

The table (`quicksearch_table.xhtml`) has 5 columns. Every result row is a `QuickReportResult` of `contentType` **Rubric** (a question answer) or **Attachment**. Values below are resolved on `QuickReportResult` / its `Rubricdata`, `Userdata2`, `Question`, `Rubric`, `Tag` members.

| # | Column header (i18n) | Sortable | Value(s) shown | Source (method → field) |
|---|----------------------|----------|----------------|--------------------------|
| 1 | *(select checkbox)* | — | Row selector for copy/export (hidden for Attachment rows in the rubric loop) | UI only |
| 2 | **Form/Question/Author/Educator** (`quicksearch.table.column.aggregate.header`) | no | Content name (links to record if accessible); Question title; "by" Author; "for" Educator | `getContentName()` (`rubric.name`/`attachment.name`), `getQuestionTitle()` (`question.name`), `getAuthor()`/`getRubricdataAuthor()`, `getTarget()` (`userdata.targetName`) |
| 3 | **Content** (`quicksearch.table.column.content.header`) | no | The answer/value, rendered per question type; annotation prefix; "(More)" when > 500 chars; script/video author + clip times; attachment icon + name + description | `getAnswer(rdata, fullText)`, `getTitle(rdata)`, `getCommentTitle(rdata)`, `getScriptAuthorName(...)`, `getScriptAuthorNameWithClipTimes(...)`, `getAttachmentDescription(...)` |
| 4 | **Tags** (`quicksearch.table.column.tags.header`) | yes (`sortByTags`) | Required (question) tags + optional (rubricdata) tags, or attachment tags; archived and quick-search-excluded tags hidden | `getQuestionTags()` (`question.tags`), `rdata.tags`, `getAttachmentTags()` |
| 5 | **Date** (`quicksearch.table.column.date.header`) | yes (`sortByDate`) | Content/record date (pretty-formatted); per-rubricdata `created` for script/video types | `getContentDate()` / `getContentDate(rdata)` / `getUserdataCreated()` → `convertDate()` |

**Empty state:** when `hasNoData`, shows `quicksearch.noData` ("No data found for report specification."). Footer note: `quicksearch.tags.info` ("*Results display only tags selected from filters.").

### `getAnswer()` — how the Content value is derived per question type
| Question type(s) | Value shown |
|------------------|-------------|
| Text Entry, Third-party Text Entry, Single/Multiple Select, Rating Scale, Pass/Fail, Timer, Duration | `rubricdata.text` (truncated to 500 chars unless full) |
| Script, Video Tag | `rubricdata.text` (+ author / clip times separately) |
| Date / Time / DateTime | Annotation → `text`; else formatted `date_value` (`qDate`/`qTime`/`qDatetime`) |
| Computed | `QuestionOutputRepresentation.fromJSON(text)` |
| Rating Scale / Pass/Fail *(title)* | `getTitle()` → `rubricdata.ratingTitle` or default rating title |

---

## 4. Result-row model — `QuickReportResult` fields

These are the values held per row (populated in `QuickReport.search()`):

| Field | Type | Meaning | Surfaced as |
|-------|------|---------|-------------|
| `contentType` | `ContentType` (RUBRIC / ATTACHMENT) | Distinguishes answer rows vs. attachment rows | Row rendering branch |
| `rubric` | `Rubric` | Form template | Content name / "Uploaded File" fallback |
| `question` | `Question` | Question the answer belongs to | Question title, question type, required tags |
| `rubricdata` | `List<Rubricdata>` | The actual answer record(s) | Content column (answers/annotations, dates, optional tags) |
| `userdata` | `Userdata2` | The form record instance | Content name link (`userdataId`), target/educator, record date, privacy/access checks |
| `privacy` | Integer | Form privacy/visibility | Access gating |
| `attachment` | `Userdata2` | Attachment record (attachment rows) | Name, type icon, description, date, userdataId |
| `attachmentTags` | `List<Tag>` | Tags on the attachment | Tags column |
| `videodata` | `Videodata` | Video metadata when attachment is video | Video link/player |
| `author` | String | Answer/record author display name | "by …" |
| `rubricdataAuthor` | String | Author of underlying rubricdata (attachment case) | "by …" |
| `userdataCreated` | Date | Creation date of the source record | Date column |
| `questionAuthorMap` | Map&lt;Integer,User&gt; | Resolves script/video comment authors | Script/video "by …" |
| `sortedTags` | `List<Tag>` | Combined tag list used for tag sorting | Tag sort |

---

## 5. Copy-to-Clipboard export (values exported)

The results header offers a "Copy to Clipboard" button (`quicksearch.fieldToCopy.copy.button.label`) with four toggle checkboxes controlling which fields are copied for selected rows (`quicksearch.js`):

| Toggle (i18n key) | Field copied | Backing value |
|-------------------|--------------|---------------|
| Form (`quicksearch.fieldToCopy.form`) | Form/content name | `.name` |
| Question (`quicksearch.fieldToCopy.question`) | Question title | `.questionTitle` (hidden input) |
| Content (`quicksearch.fieldToCopy.content`) | Full answer / attachment description | `.content` (hidden input, full text) |
| Tags (`quicksearch.fieldToCopy.tags`) | Tag names | `.tag` |

All four are checked by default (`quicksearch.fieldToCopy.label` = "Fields to copy").

---

## 6. Visibility / access rules (applied during `search()`)

- **Form answers:** each candidate `Userdata2` must pass `userCanAccessFormDataForReports(user, viewableUserIdSet)`; `viewableUserIdSet` comes from `login.getSessionCache().getEvaluatedUserIds()`.
- **Attachments:** filtered through `UserdataUTIL.filterViewableData(...)` before inclusion.
- **Record link:** in the results table, the content name is a clickable link only when `userdata.userCanAccessForm(login.userId)`; otherwise it renders as plain text.
- **Tag display:** tags with `status == ARCHIVED` or `excludedQuickSearchB == true` are suppressed everywhere (table + sort + copy).
- **Question-type gate on attachments:** an attachment tied to a question is only included when its `question.type` is in `selectedQuestionTypes` (attachments with no question are always included).

---

## 7. Note vs. the Form Change Log

Quick Search **stores nothing of its own** — there is no equivalent to the `rubricdatalog` audit table. It is a read-only aggregation of live `rubricdata` / `userdata` / attachment / `tag` records, scoped by the filter inputs in §2 and rendered as the columns in §3. "Tracked and stored" values here therefore mean **the query inputs retained on the bean** and **the fields projected into each `QuickReportResult`** for display/export.
