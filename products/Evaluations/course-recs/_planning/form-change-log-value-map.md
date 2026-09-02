# Form Change Log — Tracked & Stored Value Map

**Source repo:** `VectorLearning/teachpoint-web`
**Branch reviewed:** `integration/ui-modernization-v2-pd-tracking`

This document maps every value that is **tracked, stored, and displayed** for the Form Change Log, broken out by its two tabs: **Edits** (`formlog.editlog.title = "Edits"`) and **Access** (`formlog.accesslog.title = "Access"`).

---

## 1. Where it lives

| Layer | File |
|-------|------|
| Backing bean | [`FormChangeLog.java`](teachpoint-web/src/main/java/teachpoint/userbeans/FormChangeLog.java) — `@Named("formchangelog")`, view-scoped |
| Domain model | [`Rubricdatalog.java`](teachpoint-web/src/main/java/teachpoint/core/Rubricdatalog.java) |
| Persistence | [`RubricdatalogDAO.java`](teachpoint-web/src/main/java/teachpoint/dao/RubricdatalogDAO.java) — raw JDBC, table `rubricdatalog` |
| Dialog shell | [`dialog_formlog.xhtml`](teachpoint-web/src/main/webapp/sections/util/formlog/dialog_formlog.xhtml) |
| Shared header | [`formlogheader.xhtml`](teachpoint-web/src/main/webapp/sections/util/formlog/formlogheader.xhtml) |
| **Edits** tab | [`editlog.xhtml`](teachpoint-web/src/main/webapp/sections/util/formlog/editlog.xhtml) |
| **Access** tab | [`accesslog.xhtml`](teachpoint-web/src/main/webapp/sections/util/formlog/accesslog.xhtml) |
| Labels | [`Messages.properties`](teachpoint-web/src/main/resources/teachpoint/i18n/Messages.properties) (keys `formlog.*`) |

**Storage model:** every row in the `rubricdatalog` table is one log entry. A single form (`userdata_id`) has many entries. The bean loads them all via `RubricdatalogDAO.list(userdataId, districtId)` ordered by `created`, then each entry is routed to the **Edits** or **Access** tab by its `type`.

**Tab gating (district preferences):**
- Edits tab renders only if `districtPref.showFormEditLog` is true.
- Access tab renders only if `hasFormAccessLog()` (form-type only) **and** `districtPref.showFormAccessLog`.

---

## 2. `rubricdatalog` — full stored field inventory

These are the raw columns persisted per log entry (mapped in `RubricdatalogDAO.mapRubricdatalog`). Not all are surfaced in the UI; the "Shown in" column notes where each appears.

| Field (DB column) | Java type | Meaning | Shown in |
|-------------------|-----------|---------|----------|
| `rubricdatalog_id` | Integer | Primary key of the log entry | — (internal) |
| `act` | Integer | Action taken (Add/Update/Delete/Open/Reject…) — see §5 Action | Edits (verb in legend) |
| `type` | Integer | Entry type; routes display & tab — see §5 Type | Edits + Access (type label) |
| `source` | Integer | Origin of the action (Web/Sync/Mobile…) — see §5 Source | **Edits + Access** |
| `reason` | Integer | Reason qualifier (e.g. Already Signed) — see §5 Reason | Edits (shown when `reason > 0`) |
| `detail` | String | Free-text detail (e.g. attachment name + date) | Edits (detail rows) |
| `editor` | Integer | User id who made the edit (resolves to editor name; root → "Support Agent") | **Edits + Access** (author column) |
| `created` | Date/Timestamp | Timestamp the log entry was recorded | **Edits + Access** (date/time column) |
| `district_id` | Integer | Tenant/district scope | — (internal, query filter) |
| `userdata_id` | String | The form/record instance this entry belongs to | — (routing: own vs. attachment) |
| `rubric_id` | Integer | Rubric (form template) id | — (internal) |
| `question_id` | Integer | Question the entry pertains to (for DATA/TAGS) | Edits (question title/type) |
| `rating_id` | Integer | Selected rating id | — (internal; feeds rating text) |
| `value` | Float | Numeric rating value | Edits (converted to rating text) |
| `text` | String | Text answer / name / description / signature payload | Edits (answer body) |
| `text_duration` | String | Duration entry text (minutes) | Edits (Duration entry) |
| `date_value` | Date | Date/Time answer value | Edits (date/time/datetime answers) |
| `int_value` | Integer | Integer payload for on/off & state types (share, privacy, grade, elapsed, archived) | Edits + Access (display value) |
| `range_start` | Integer | Video clip start (seconds) | Edits (video clip) |
| `range_end` | Integer | Video clip end (seconds) | Edits (video clip) |
| `is_annotation` | Integer | 1 = entry is an annotation | Edits (Annotation row) |
| `is_duration` | Integer | 1 = entry is a duration entry | Edits (Duration row) |
| `user_id` | Integer | Target/owner user of the record | Edits + Access (name resolution) |
| `loggedin_user_id` | Integer | Actual logged-in user when different from `user_id` (account-switch / "AS") | **Edits + Access** ("X AS Y") |
| `modified` | Date | Underlying rubricdata modified timestamp | — (used by recent-changes query) |
| `author_id` | Integer | Author of the underlying rubricdata | — (internal) |
| `rdorder` | Integer | Ordering within a record | — (internal sort) |
| `is_comment` | Integer | 0 = Note, 1 = Comment (video tag) | Edits (Note/Comment label + clip range) |
| `rubricdata_created` | Date | Creation timestamp of the underlying rubricdata | — (internal) |
| `signature_userdata_id` | String | Links hand-drawn signature image | Edits (hand-drawn signature image link) |

---

## 3. Shared header (shown above BOTH tabs)

Rendered by `formlogheader.xhtml`; values come from the `Userdata` record, not `rubricdatalog`.

| Label (i18n key) | Displayed value | Source |
|------------------|-----------------|--------|
| Name (`formlog.header.name`) | Form/record name | `getChangeLogName()` → `userdata.udname` / rubric name |
| Original Name (`formlog.header.original.name`) | Rubric's original name (only if renamed) | `getRubricName()`; shown when `showOriginalName()` |
| Author (`formlog.header.author`) | Evaluator display name (or "System Administrator" for computed) | `evaluator.displayName` |
| Evaluee (`formlog.header.evaluee`) | Target user display name | `targetUser.displayName` |
| Date (`formlog.header.date`) | Form date | `userdata.created` |
| Created (`formlog.header.created`) | Rubric date | `userdata.rubricDate` |
| Last Modified (`formlog.header.last.modified`) | Last modified date | `userdata.modified` |

Dialog title varies by record type (`formlog.title.*`): **Form / Image / Document / Google Document / Google Link / External Link** Change Log.

A warning banner (`formlog.log.feature.date.warning`) appears when `userdata.created` is before **2012-11-19** (logging feature start date).

---

## 4. Tab-by-tab value mapping

The routing hinge is `isAccessEntry(entry)` in `FormChangeLog.java`. Entries whose `type` is one of the four `OPEN_*` access types go to **Access**; everything else goes to **Edits**.

### 4a. Form Change Log → **Edits**

Renders any entry where `!isAccessEntry(logentry)`. Entries are grouped into four display shapes:

| Display group | Bean method / gate | Entry types included | Values displayed |
|---------------|--------------------|----------------------|------------------|
| **Question entry** | `showQuestionEntry` (types `DATA`, `TAGS`) | `DATA` (0), `TAGS` (16) | Action verb (`act`) + optional reason; `created`; `source`; editor (`editor`/`loggedin_user_id` "AS" `user_id`); question title (`question_id`); question type name; and the **answer**, rendered per question type — rating text (`value`→`rating_id`), rich text (`text`), annotation (`text` + `is_annotation`), duration (`text_duration` + `is_duration`), note/comment + clip range (`is_comment`, `range_start`, `range_end`), signature (`text` or hand-drawn image via `signature_userdata_id`), date/time/datetime (`date_value`), computed (`text`), tags (`text`) |
| **Short heading** | `showHeadingEntryShort` | `SHARE` (1), `PRIVACY` (17), `ELAPSED_TIME` (2), `GRADE` (5), `DATE` (23), `ARCHIVED_STATE` (8) | Type label; display value via `getLogDisplayValue` (On/Off, timer format, grade name, date, Delete/Un-Delete); editor; source; `created` |
| **Short heading + detail** | `showHeadingEntryShortWithDetail` | `CLONED` (10), `CLONE` (11), `IMPORTED` (22), `ATTACH` (12), `DETACH` (13), `MIGRATED` (14), `MIGRATE` (15) | Type label; display value; `created`; source; editor; plus `detail` free-text line (e.g. attachment name + date). Colored text via `getTextStyleClass` |
| **Long heading** | `showHeadingEntryLong` | `NAME` (6), `DESCRIPTION` (7) | Action verb; `created`; source; editor; the full `text` value (the new name/description) |
| **Attachment block** | rendered when entry's `userdata_id ≠` the form's id and `hasAccessLog()` | `NAME`/`DESCRIPTION` on attached records | State (display value or "Updated"); attachment Name (`getAttachmentName` / `text`); Description (`text`, when `DESCRIPTION`) |

**`getLogDisplayValue` mapping (Edits state values):**
- `SHARE`: `int_value==1` → "On", else "Off"
- `PRIVACY`: `int_value==0` → "On", else "Off"
- `ELAPSED_TIME`: `int_value` → timer format (HH:MM:SS)
- `DATE`: `date_value` → formatted date
- `GRADE`: `int_value` → grade name
- `ARCHIVED_STATE`: `int_value==1` → "Delete", else "Un-Delete"

### 4b. Form Change Log → **Access**

Renders only entries where `isAccessEntry(logentry)` is true — i.e. `type` ∈ the access set below — **and** an additional visibility filter (see §6). Uses the "short heading" display shape only.

| Access `type` | Constant | Label (`formlog.logentry.type.*`) | Meaning |
|---------------|----------|-----------------------------------|---------|
| 18 | `TYPE_OPEN_CREATE` | Created | Form was created (also drives "complete access log" flag) |
| 19 | `TYPE_OPEN_RECORD` | Opened | Form record was opened |
| 20 | `TYPE_OPEN_PDF` | Viewed PDF | Form PDF was viewed |
| 21 | `TYPE_OPEN_PRINT` | Viewed | Form was viewed/printed |

**Values displayed per access entry:**

| Value | Source field | Notes |
|-------|--------------|-------|
| Access type / action | `type` | e.g. "Created", "Opened", "Viewed PDF", "Viewed" |
| Display value (if any) | `getLogDisplayValue` | Usually empty for OPEN_* types |
| Acting user | `editor` → `getEditorName`; `loggedin_user_id` "AS" `user_id` when switched | Root user shown as "Vector Solutions Support Agent" to non-root |
| Source | `source` | WEB / SYNC / AUTO-GENERATED / RESTORE / MOBILE API |
| Timestamp | `created` | Date + time the access occurred |

**Access-log completeness warnings:**
- No `OPEN_*` entries at all → `formlog.accesslog.warning.no.access.log` ("No access log available…").
- Entries exist but no `OPEN_CREATE` → `formlog.accesslog.warning.incomplete.access.log` ("Incomplete access log…").

> Note: `OPEN_COMPLETED` (24, "Completed") is written to `rubricdatalog` and used for form messaging/notifications, but it is **not** part of `isAccessEntry` and does not surface as its own row in either tab's rendering logic.

---

## 5. Enum / coded-value reference

### Action (`act`)
| Const | Value | name | verb |
|-------|-------|------|------|
| `ACT_ADD` | 0 | Add | Added |
| `ACT_UPDATE` | 1 | Update | Updated |
| `ACT_DELETE` | 2 | Delete | Deleted |
| `ACT_SYNC_REJECTED` | 3 | Sync Rejected | Sync Rejected |
| `ACT_OPEN` | 4 | Open | Opened |
| `ACT_REJECTED` | 5 | Reject | Rejected |

### Type (`type`) — full set
| Const | Value | Label | Operation? | Tab | Payload field |
|-------|-------|-------|-----------|-----|---------------|
| `TYPE_DATA` | 0 | Question | no | Edits | rubricdata fields (`text`/`value`/`date_value`…) |
| `TYPE_SHARE` | 1 | Sharing | yes | Edits | `int_value` |
| `TYPE_ELAPSED_TIME` | 2 | Elapsed Time | no | Edits | `int_value` |
| `TYPE_SCHOOL` | 3 | School | no | Edits* | `int_value` |
| `TYPE_SUBJECT` | 4 | Subject | no | Edits* | `int_value` |
| `TYPE_GRADE` | 5 | Grade | no | Edits | `int_value` |
| `TYPE_NAME` | 6 | Name | no | Edits | `text` |
| `TYPE_DESCRIPTION` | 7 | Description | no | Edits | `text` |
| `TYPE_ARCHIVED_STATE` | 8 | State | yes | Edits | `int_value` |
| `TYPE_DELETED_STATE` | 9 | State | yes | Edits* | `int_value` |
| `TYPE_CLONED` | 10 | Copied | yes | Edits | `int_value` + `detail` |
| `TYPE_CLONE` | 11 | Copy | yes | Edits | `int_value` + `detail` |
| `TYPE_ATTACH` | 12 | Attach | yes | Edits | `int_value` + `detail` |
| `TYPE_DETACH` | 13 | Detach | yes | Edits | `int_value` + `detail` |
| `TYPE_MIGRATED` | 14 | Migrated | yes | Edits | `int_value` + `detail` |
| `TYPE_MIGRATE` | 15 | Migrate | yes | Edits | `int_value` + `detail` |
| `TYPE_TAGS` | 16 | Tags | no | Edits | `text` |
| `TYPE_PRIVACY` | 17 | Privacy | yes | Edits | `int_value` |
| `TYPE_OPEN_CREATE` | 18 | Created | yes | **Access** | none |
| `TYPE_OPEN_RECORD` | 19 | Opened | yes | **Access** | none |
| `TYPE_OPEN_PDF` | 20 | Viewed PDF | yes | **Access** | none |
| `TYPE_OPEN_PRINT` | 21 | Viewed | yes | **Access** | none |
| `TYPE_IMPORTED` | 22 | Imported | yes | Edits | none |
| `TYPE_DATE` | 23 | Date | no | Edits | `date_value` |
| `TYPE_OPEN_COMPLETED` | 24 | Completed | yes | neither (messaging only) | `date_value` |

\* `SCHOOL`, `SUBJECT`, `DELETED_STATE` are defined and persisted but are not enumerated in the current Edits render gates (`showHeadingEntryShort` / `…WithDetail` / `…Long`), so they have no dedicated row in the present UI.

### Source (`source`)
| Const | Value | Displayed |
|-------|-------|-----------|
| `SOURCE_WEB` | 0 | WEB |
| `SOURCE_SYNC` | 1 | SYNC |
| `SOURCE_AUTOGEN` | 2 | AUTO-GENERATED |
| `SOURCE_RESTORE` | 3 | RESTORE |
| `SOURCE_RESTORE_SYNCDATA` | 4 | RESTORE |
| `SOURCE_MOBILE_API` | 5 | MOBILE API |

### Reason (`reason`)
| Const | Value | Displayed |
|-------|-------|-----------|
| `REASON_UNKNOWN` | 0 | Unknown |
| `REASON_ALREADY_SIGNED` | 1 | Already Signed |
| `REASON_NEWER_EDIT` | 2 | Newer Edits Made |

---

## 6. Visibility / permission rules (apply to both tabs)

Row-level visibility is enforced by `showLogEntry(entry)`:
- **Administrators / root** see all entries.
- The **author** of an entry (`entry.user_id == login user`) sees their own entries.
- **All users** can see signature-type entries and any entry that `isOperation()` (operation types).

Additional gate specific to the **Access** tab (`accesslog.xhtml`): an access entry is only shown when it passes `isAccessEntry` **and** one of:
- `loggedin_user_id` is null, **or**
- `loggedin_user_id == user_id` (no account switch), **or**
- entry `type == OPEN_CREATE`, **or**
- the viewer has switched accounts (`login.userHasSwitchedAccounts()`), **or**
- the viewer is a root user.

Editor-name resolution (`getEditorName`): root editors display as **"Vector Solutions Support Agent"** to non-root viewers; hand-drawn signatures by a different signer show as `signer AS owner`.
