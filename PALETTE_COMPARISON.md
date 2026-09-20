# Daily palette comparison: v1 and v2

## Historical palette after background rollback

After the earlier rollback, `src/data/daily-colors.csv` combined **v1 light/dark backgrounds** with **v2 base colors, text colors, and slider accents**. Both original import files remain unchanged. Future imports should explicitly decide whether to replace this hybrid palette.

## File structure

Both files contain the same nine columns and all 366 month/day rows, including February 29. Dates and leap-day indices are identical. The differences are color values, not date alignment or column mapping.

## Changes by column

Saturation below is mean HSV saturation across all 366 rows, rounded to one decimal place. It describes RGB colorfulness, not perceptual contrast or accessibility.

- **`base_seasonal_color`**: 303/366 dates changed; distinct colors 362 → 360; average saturation 39.3% → 44.0%.
- **`light_background`**: 366/366 dates changed; distinct colors 199 → 111; average saturation 4.7% → 1.1%.
- **`light_text`**: 366/366 dates changed; distinct colors 219 → 187; average saturation 32.0% → 35.0%.
- **`light_slider_accent`**: 303/366 dates changed; distinct colors 362 → 360; average saturation 39.3% → 44.0%.
- **`dark_background`**: 366/366 dates changed; distinct colors 192 → 151; average saturation 29.2% → 30.1%.
- **`dark_text`**: 366/366 dates changed; distinct colors 213 → 111; average saturation 5.0% → 1.2%.
- **`dark_slider_accent`**: 366/366 dates changed; distinct colors 329 → 237; average saturation 12.7% → 7.2%.

## Representative background changes (v1 → v2)

On January 1, March 20, and June 21, the base seasonal color is identical in both versions, so their background differences cannot be explained by a changed base color.

- **01-01**: base `#A9C7D8` → `#A9C7D8`; light background `#F0F5F8` → `#F5F4F4`; dark background `#2E3836` → `#2F4435`.
- **03-20**: base `#3F7048` → `#3F7048`; light background `#DDE6DE` → `#E4E2E1`; dark background `#1B281C` → `#1D281D`.
- **06-21**: base `#D4B86E` → `#D4B86E`; light background `#F8F3E7` → `#F0EEEE`; dark background `#363524` → `#2E3E28`.
- **09-09**: base `#5C6D42` → `#B97032`; light background `#E1E5DD` → `#EAE6E5`; dark background `#20271B` → `#263220`.
- **10-31**: base `#7F4C54` → `#7F4B54`; light background `#E9DFE0` → `#E6E4E4`; dark background `#28221E` → `#252B20`.
- **12-25**: base `#A9CADE` → `#A9CADE`; light background `#F0F6F9` → `#F6F4F5`; dark background `#2E3837` → `#2F4636`.

## Interpretation and follow-up

- V2 light backgrounds are substantially more neutral: pale blue, green, and gold tints in v1 became near-gray in v2.
- V2 dark backgrounds shift toward green overall; their average saturation is similar to v1, so this is a hue shift rather than general desaturation.
- V2 light text also shifts toward green overall. Dark text becomes more neutral.
- V2 dark slider accents become less saturated on average.
- Light slider accents exactly equal the base seasonal color in both files. Their stronger color is therefore expected.
- V2 changes the base palette itself on 303 dates. For example, September 9 changes from olive green to warm orange. Restoring backgrounds alone intentionally does not revert these base/slider changes.
- The CSV files contain results, not generating formulas. A change or error in the derivation process is a plausible explanation, but its exact cause cannot be established from these files.
- For a future revision, inspect the original color-generation methodology, decide how strongly backgrounds should retain base hue, and review text contrast and slider visibility in both modes. Do not assume v1 and v2 differ only in saturation.

## V3 applied

The active palette now matches `in_season_daily_colors_v3.csv` exactly in all columns, replacing the intermediate v1/v2 combination. V3 differs from v1 only from July 21 through September 21 (63 dates), restoring seasonal background tints while revising the late-summer palette. All 366 dates, including February 29, are present. Original import files are preserved.
