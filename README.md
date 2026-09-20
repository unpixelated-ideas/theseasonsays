# The Season Says

**The Season Says · 계절이 말한다 · Deir an Séasúr** This is a local, client-side seasonal almanac. It deliberately combines Northern Hemisphere astronomical boundaries with U.S., Korean, and Irish cultural traditions. The rules are editorial choices, not universal prescriptions.

## Run locally

Install Node.js 20 or newer. There are **no application dependencies to install**. Open a terminal in the project directory:

```sh
npm run dev
```

Open `http://127.0.0.1:5173`. Stop the server with Ctrl+C. Alternatively run `node scripts/dev.mjs`. Reload after changing source files; the tiny server intentionally has no hot-reload framework. Do not open `index.html` directly with `file://`: browsers require HTTP to load JavaScript modules and CSV files.

```sh
npm test
npm run build
node scripts/dev.mjs --dist
```

The build copies the static application into `dist/` and inserts the configured title and description into the HTML. Only one preview server can use port 5173 at a time. Node is a development tool; the deployed site needs no backend, accounts, API keys, database, or cloud setup. All application resources are local, including fonts (system font stacks). No analytics or geolocation are used.

## Project map

- `src/config/site.js`: branding, localized tagline and metadata, temporary background fallbacks, supported exploration years.
- `src/data/calendar.csv`: primary source of truth for the seasonal periods and suggestions.
- `src/data/daily-colors.csv`: 366 daily light/dark palettes imported from `in_season_daily_colors_v3.csv`.
- `src/data/annual-dates.csv`: maintained astronomical instants and Korean lunar holiday dates.
- `src/lib/`: CSV validation, local civil-date arithmetic, and calendar engine.
- `src/i18n/messages.js`: English, Korean, and Irish UI copy and countdown wording.
- `src/components/views.js`: reusable card and annual-calendar rendering.
- `src/main.js`: application state, date controls, routing, live clock, preferences.
- `src/styles/main.css`: responsive light/dark design, without shadows or gradients.
- `tests/calendar.test.js`: calendar, validation, localization, and leap-year tests.

## Working product name

The localized **`productName` map in `src/config/site.js`** defines the product name for English, Korean, and Irish. The heading, document title, build-time HTML title, and relevant page references use that configuration and follow the selected language. The static HTML fallback uses English. Taglines and descriptions are independently localized in the same file. Rebuild after changing branding. No final domain, logo, favicon, repository identity, or social image is assumed. Add future canonical/social metadata here when those details are known. The generic package name is deliberately independent of the product name.

## Editing `calendar.csv`

Save as UTF-8 CSV with the header intact. A spreadsheet editor or plain-text editor works. Every row is one inclusive seasonal period. Multiple rows may be active together; they are never forced into mutually exclusive holidays.

| Columns | Meaning |
| --- | --- |
| `id` | Required unique stable identifier. Used for comparisons; not shown to visitors. |
| `name_en`, `name_ko`, `name_ga` | Names in English, Korean, and Irish. Populate all three for complete localization. |
| `category` | `season`, `holiday`, `transition`, or `recognition`. Broad seasons coexist with other categories. |
| `start_rule`, `end_rule` | Required inclusive boundaries, using the rule syntax below. |
| `priority` | Numeric prominence. Higher numbers appear first in the primary card. This does not remove other periods. |
| `emoji` | Optional single seasonal symbol. Symbols appear in the primary card and the Also in Season headings. |
| `description_en`, `description_ko`, `description_ga` | Short localized introductions. |
| `permissible_{decor,food,activities,media}_{en,ko,ga}` | Optional suggestions, split into the four content groups and three languages. |
| `impermissible_{decor,food,activities,media}_{en,ko,ga}` | Optional future “for later” guidance. Intentionally blank in this prototype. No prohibitions have been invented. |
| `notes` | Internal editorial notes; not rendered. |

Content fields can safely remain blank. The UI omits empty groups. Keep translated content aligned; it does not translate English on the fly or silently insert English into other languages.

Within a list cell, separate items with **` | `**, for example `Fresh flowers | Light linens`. A literal pipe is therefore reserved as the list delimiter. Ordinary CSV rules still apply: quote a cell containing a comma, quote, or newline, and escape literal quotation marks by doubling them. Example:

```csv
"Red, white, and blue accents"
"A book called ""Winter"""
```

### Date rules

- Fixed date: `10-01`, `01-06`, `12-26` (two-digit month/day).
- Named astronomical event: `spring`, `summer`, `autumn`, `winter`.
- Named lunar holiday: `lunar-new-year`, `chuseok`.
- Calculated Gregorian Easter: `easter` (Western Easter).
- Calculated U.S. holidays: `memorial` (last Monday in May), `labor` (first Monday in September), `thanksgiving` (fourth Thursday in November).
- Add/subtract calendar days with one integer suffix: `easter-14`, `chuseok-21`, `thanksgiving+1`, `spring-1`.

Dates include both endpoints. If the end comes before the start, the period crosses into the following year. Thus `thanksgiving+1` to `01-06` covers Black Friday through January 6. The engine also evaluates the previous year's periods, so January remains correct.

Spring continues until the day before astronomical summer. A separate summer-adjacent row begins on Memorial Day. Late summer starts on Labor Day, replacing the broad summer row. Autumn continues through the day before the astronomical winter solstice. Winter starts on the local calendar date of that solstice; this replaces the original December 1 cultural-winter rule. March 18 through the day before spring is a transitional overlay. Lunar previews use 21 days; Easter uses 14 days. Juneteenth is currently omitted; it can be restored by adding a CSV row. These offsets are editable in the CSV.

To add a period, copy a row, assign a new ID, provide its dates and three translations, and leave unused suggestions blank. Adjust `priority` only if its prominence should change. Ordinary calendar edits require no component changes. Run `npm test` and check the chosen date afterward.

### Annual astronomical and lunar data

The maintained exploration range is **2024–2028**, including leap years. `annual-dates.csv` has `year,event,date` columns. Astronomical dates are UTC instants (`YYYY-MM-DDTHH:mm:00Z`), converted to the visitor's **local calendar date**. That whole local date starts the seasonal period: this is a date-based almanac, not an instant-based astronomy clock. Lunar holidays are Korean civil dates (`YYYY-MM-DD`) and never shifted into another time zone.

Sources for maintenance:

- [National Weather Service astronomical seasons, 2025–2030](https://www.weather.gov/dvn/Climate_Astronomical_Seasons), including UTC times.
- [U.S. Naval Observatory season data](https://aa.usno.navy.mil/data/Earth_Seasons), including the 2024 boundaries.
- [Korea Astronomy and Space Science Institute calendar data](https://astro.kasi.re.kr/kor/life/post/calendarData) for Korean lunar holidays. Future calendar publications can be provisional.
- [KASI's explanation of Korean/Chinese lunar-date differences](https://www.kasi.re.kr/publication/post/newsMaterial/2151): Korean Seollal is February 7 in 2027, not the Chinese date of February 6.

Extend the annual CSV and `minYear`/`maxYear` in site configuration together. Include the following year's spring for winter periods that cross the upper boundary. The extra 2029 spring entry supports winter starting December 2028. Add neighboring-year lunar dates if extending countdown support beyond the displayed range. Missing annual events are omitted; dates outside the supported range display a notice rather than inventing astronomical or lunar dates. The device clock itself always works.

## Editing `daily-colors.csv`

The active source is `src/data/daily-colors.csv`, imported unchanged from the supplied `in_season_daily_colors_v3.csv`. Edit the active source for future changes; the root file is the original import, not a second live source.

There are 366 date rows, including February 29. The columns are:

- `date_mm_dd`: calendar month/day, such as `02-29`; used for lookup, never the day-of-year index.
- `leap_day_index`: reference index within a leap year (1–366).
- `base_seasonal_color`: preserved editorial reference color; not separately applied to the UI.
- `light_background`, `light_text`, `light_slider_accent`: light appearance colors.
- `dark_background`, `dark_text`, `dark_slider_accent`: dark appearance colors.

Use six-digit hex values. System appearance chooses the matching light/dark columns. Changing the date immediately updates the page background, page text (including secondary utility copy), and slider accent. Cards and calendar-picker surfaces retain their fixed appearance colors. Non-leap years skip February 29 without shifting any later dates.

Blank or invalid display colors fall back independently to `fallbackPalette` in `src/config/site.js`. The parser also accepts the original month/day and background-only schema for compatibility. The original background fallback configuration remains available to that legacy helper.

## Validation and behavior

CSV warnings identify the file and row for invalid calendar rules, duplicate IDs, invalid month/day pairs, duplicate colors, and invalid hex values. Malformed rows are skipped; invalid optional colors fall back. An unclosed quoted CSV field is reported and that file's parsed records are discarded to avoid interpreting broken data. Blank optional fields do not cause failures. The daily-color loader warns if the valid map does not contain 366 days.

`actualNow`, `today`, and `selectedDate` have separate responsibilities. The clock ticks every second. Date exploration uses local noon civil dates; calendar-day differences use UTC ordinals of local year/month/day parts solely for arithmetic, never UTC parsing of a visitor's selected date. This avoids DST countdown errors and date shifts. When following today, local midnight updates both date controls and all seasonal content. An explored date stays fixed; “Today” restores live following. During date exploration, the live clock and time-zone text are hidden with their layout space reserved; they reappear when viewing today.

The calendar picker and native keyboard/touch slider are synchronized. The slider follows the selected year's 365 or 366 days. Native date controls may follow the browser/OS language for their internal picker chrome; application labels and formatted dates use the selected site language. Language never changes the visitor's time zone. Irish date names are bundled explicitly so browsers without Irish locale data cannot fall back to English. Time-zone labels use localized names and an accurate UTC offset; untranslated IANA identifiers are not displayed. Unknown zones fall back to a localized local-time-zone label if the browser lacks a translation.

The annual view derives from the same period instances as the home page and clips cross-year ranges to its displayed year. The next card considers both starts and ends, so January 7 and post-holiday resets are recognized. All five footer labels are currently disabled and show a not-allowed cursor. The underlying annual-calendar and placeholder routes remain available by direct URL for future reactivation; feedback has no submission backend.

## Tests

`npm test` runs 38 tests, including the specified seasonal boundaries, every supported day's broad-season coverage, movable holidays, cross-year overlaps, malformed CSV, duplicate identifiers/dates, leap day, color fallbacks, and translation completeness. For time-zone coverage:

```sh
TZ=America/New_York npm test
TZ=Asia/Seoul npm test
TZ=Pacific/Honolulu npm test
```

An optional `scripts/browser-check.mjs` integration script uses a separately installed Playwright package and Chromium. It is not a production dependency. Run it with the preview server running; set `PLAYWRIGHT_MODULE` to your Playwright module path if it is not locally resolvable, and optionally `BROWSER_CHANNEL=chrome` to use installed Chrome. It checks clock ticks, midnight/year rollover, pinned exploration, date controls, responsive widths, themes, all languages, footer routes, and a mocked branding rename. Screenshots are temporary files outside the repository.

## GitHub and static hosting

The website's public URL after deployment is [The Season Says](https://unpixelated-ideas.github.io/theseasonsays/). The source repository is [unpixelated-ideas/theseasonsays](https://github.com/unpixelated-ideas/theseasonsays). Commit changes to the source CSV files; do not commit `dist/`, dependencies, environment files, or temporary screenshots.

`.github/workflows/pages.yml` tests and builds the application with Node.js 24, then publishes **only `dist/`** using GitHub's official Pages actions on every push to `main`. It can also be run manually from **Actions → Deploy to GitHub Pages → Run workflow**. There are no dependencies to install; npm only runs the existing scripts.

One-time setup on GitHub: open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. Commit and push the changes to `main` using GitHub Desktop, then wait for the deployment workflow to succeed. If the initial run happened before enabling Pages, rerun it from Actions. Leave the custom-domain field empty.

The existing build already supports `/theseasonsays/`: HTML uses relative stylesheet/module URLs, JavaScript imports are relative, and CSV URLs resolve relative to their module using `import.meta.url`. Hash routes such as `/theseasonsays/#complete`, `#privacy`, and `#terms` keep direct links and refreshes on the same static entry page without server rewrites or a 404 workaround. English, Korean, and Irish use the existing language selector and saved preference, with bundled translations; there are no separate `/ko/` or `/ga/` routes. Branding and localized metadata remain unchanged.

For another static host, run `npm run build` and publish the contents of `dist/`. No repository path or domain is hardcoded into the application, so the same output also supports a future custom domain.

Before public release, review Korean and Irish editorial copy with fluent speakers and replace the placeholder legal/feedback pages as appropriate.

## Update log

The footer Update Log button opens a keyboard-accessible modal with dated entries in English, Korean, and Irish. Add entries and translations in `src/data/updates.js`. Dates use the same localized civil-date formatting as the guide. Close it with the Close button, Escape, or a click outside the popup.

See `PALETTE_COMPARISON.md` for the historical v1/v2 comparison and background rollback. The active palette now uses v3 in full; all original imports remain unchanged.

## Allowed and Not Allowed

The cards combine all four permissible content categories into one “Allowed” list and all four impermissible categories into one “Not Allowed” list. Duplicate items are shown once. The CSV columns remain unchanged for editorial organization. Empty lists display “None specified yet,” which does not imply that all items are allowed. Both headings and the empty-state text are translated.

### Editorial reset

Automatic draft restrictions have been removed. Allowed and Not Allowed now contain only explicitly entered CSV content. Existing suggestions were cleared. Late Summer’s Not Allowed and Autumn’s Allowed share the ten approved non-Halloween items. Halloween décor is additionally Not Allowed in Late Summer, and is Allowed only in Halloween’s list. Halloween now has 13 explicitly allowed items and 8 Thanksgiving-themed items marked Not Allowed. Thanksgiving allows the eight Thanksgiving-themed items plus the ten Autumn Allowed items and disallows the twenty holiday items; Holiday Season allows those same twenty holiday items. The remaining periods’ permission lists are blank. All three languages are maintained.

### Date-limited Not Allowed lists

Optional `impermissible_end_rule` sets the inclusive final date for a period’s Not Allowed content, using the same syntax as other date rules and resolved within the period’s starting calendar year. A cutoff earlier than the period start rolls into the following year. Blank means the list lasts throughout the period. Autumn uses `09-30`: its Not Allowed list mirrors Halloween’s Allowed list through September 30, then uses Halloween’s Not Allowed list during October. Allowed content is unaffected.

Autumn uses `impermissible_override_start_rule=11-01` and `impermissible_override_source=thanksgiving` to reuse Thanksgiving’s Not Allowed content from November 1 through Autumn’s end at the winter solstice. This override takes precedence over the September cutoff and follows future edits to Thanksgiving’s list. It continues after Thanksgiving, including the overlapping Holiday Season dates, as specified.

Autumn’s October window is configured by `impermissible_interim_start_rule=10-01`, `impermissible_interim_end_rule=10-31`, and `impermissible_interim_source=halloween`. Both dates are inclusive; the list follows edits to Halloween’s Not Allowed content. November’s override still begins November 1.

New Year’s Allowed contains the 18 approved celebration items. Holiday Season lists the same items as Not Allowed through its `12-25` cutoff. These restrictions are removed on December 26 and remain absent in January; the cutoff is anchored to the period’s start year. New Year’s Allowed continues through January 6.

Winter allows snowmen, snowflakes, snow-covered scenery, and winter village décor. Its Not Allowed list contains the eleven approved Valentine-themed items; Valentine’s Day allows those same items. Winter’s Valentine restrictions apply only through January 31, using `impermissible_end_rule=01-31`; its Allowed items remain unchanged.

St. Patrick’s Day allows the fourteen approved items. Winter reuses them as Not Allowed only February 15 through the final day of February: `impermissible_interim_start_rule=02-15`, `impermissible_interim_end_rule=03-01-1`, `impermissible_interim_source=patrick`, and `impermissible_interim_source_prefix=permissible`. Subtracting one day from March 1 automatically includes February 29 in leap years. The optional source prefix defaults to `impermissible` for existing windows.

Chuseok’s Allowed list contains the eleven approved harvest and Korean cultural items. Lunar New Year’s Allowed list contains the eight approved New Year items, including tteokguk. Both lists are translated into Korean and Irish; Chuseok retains its secondary priority.

Spring, Easter, Late Spring, Summer, U.S. Independence Day, and Late Summer now have the requested Allowed lists, translated into Korean and Irish. The period names are `Late Spring` and `U.S. Independence Day`.
