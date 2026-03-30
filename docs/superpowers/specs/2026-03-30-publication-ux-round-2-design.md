# Publication Template — UX Improvements Round 2

## Overview

A focused round of UX improvements to the publication template addressing broken navigation, missing interactivity, and adding new features to make the template production-ready for real publications.

## Scope

Four changes, ordered by complexity:

1. Clickable story images (bug fix)
2. Section pages + working nav links (new feature)
3. Story detail breadcrumb + "More from this section" (new feature)
4. Reading time estimates (new feature)

## 1. Clickable Story Images

**Problem:** On the homepage, story headlines link to the story detail page but the associated images do not. Users expect images to be clickable.

**Solution:**

- Wrap the featured story image (or placeholder) in `<a href="{{ story.path }}.html">`
- Wrap each story card image (or placeholder) in `<a href="{{ story.path }}.html">`
- Add a subtle hover effect on images to signal clickability: slight opacity reduction (`opacity: 0.9`) on hover with a CSS transition

**Files changed:** `pages/index.liquid`, `public/styles.css`

## 2. Section Pages + Working Nav Links

**Problem:** The header nav links (Politics, Culture, Technology, Opinion) point to `/#slug` anchors that don't exist. There are no section-specific pages.

**Solution:**

### New template: `pages/section.liquid`

Create a section page template that generates one page per section at `/sections/{slug}.html`.

**Layout — Lead Story + Grid:**
- The first story in the section gets a larger 2-column layout (image left, text right) matching the homepage featured story pattern
- Remaining stories display in a card grid below (reusing the `story-card` pattern from the homepage)
- Section header: centered section name with story count, preceded by a breadcrumb (`Home / Section Name`)

**Template logic:**
- Loop through `stories`, filter by `story.section == sections.name` (where `sections` is the current section object on a section template page)
- First matching story renders in the lead position
- Remaining stories render in the grid
- If only one story exists, show just the lead layout with no grid

### Section object changes

Add `template = "section"` to the `[sections]` definition in `objects.toml` so that Archival generates a page for each section object.

### Nav link updates

In `layout/theme.liquid`, change nav links from `/#{{ section.slug }}` to `/sections/{{ section.slug }}.html`.

Add an active state: when the current page matches the section, apply an accent-color bottom border to the nav link. This requires passing the current section name to the layout and comparing it in the nav loop.

### Section tag links

On the homepage and section pages, the section label on story cards (e.g., "Technology") becomes a link to the corresponding section page. Same for the section label on the story detail page.

To link section tags, construct the slug from the story's section name using Liquid's `downcase` filter (e.g., `{{ story.section | downcase }}`). This works because section slugs are the lowercased section names (Politics → politics, Culture → culture, etc.).

**Files changed:** `objects.toml`, new `pages/section.liquid`, `layout/theme.liquid`, `pages/index.liquid`, `pages/story.liquid`, `public/styles.css`

**New CSS needed:**
- `.section-page` container (reuses `front-page` max-width/padding)
- `.section-page-header` (centered section name, story count, breadcrumb)
- `.section-lead-story` (reuses `featured-story` grid pattern but at section-page scale)
- `.nav-link--active` state (accent color, bottom border)
- Responsive: lead story collapses to single column at 900px, grid to 2 columns at 900px and 1 column at 600px

## 3. Story Detail Navigation

**Problem:** The story detail page is a dead end. No breadcrumb, no way to discover related content.

**Solution:**

### Breadcrumb navigation

Add a breadcrumb bar above the story header, inside the reading-width column:

```
Home / Technology / The Quiet Revolution in Battery...
```

- "Home" links to `/`
- Section name links to `/sections/{slug}.html`
- Story title is plain text, truncated with CSS `text-overflow: ellipsis` if long
- Styled with the existing `--font-sans`, `--text-xs`, uppercase, matching the nav link aesthetic

### "More from this section" block

Add a content block after `.story-body`, before the footer:

- Section divider with centered label: "More from Technology" (using the existing `.section-divider` pattern already defined in the CSS)
- 3-column grid showing up to 3 other stories from the same section, excluding the current story
- Each card: image (3:2 aspect), headline, author, reading time
- Images and headlines link to the story
- "All Technology Stories →" link below the grid, pointing to the section page
- If fewer than 2 other stories exist in the section (0 or 1), hide the entire block — a single related story looks incomplete

**Responsive:** 3 columns → 2 at 900px → 1 at 600px

**Template logic:**
- Loop through `stories`, filter where `story.section == stories.section` (current story's section) and `story.slug != stories.slug` (exclude current)
- Limit to 3 results
- Track count to conditionally render the block

**Important assumption:** This requires the full `stories` collection to be available on story detail pages. On detail pages, `stories` (the collection name) refers to the current story object. Other collections (like `sections`) should still be available as arrays. During implementation, verify whether Archival also provides access to sibling story objects — if not, the "More from section" block cannot be implemented in pure Liquid and would need to be dropped or solved differently.

**Files changed:** `pages/story.liquid`, `public/styles.css`

**New CSS needed:**
- `.story-breadcrumb` (positioned above story header)
- `.more-from-section` container
- `.more-from-grid` (3-column grid, reuses story-card styling at smaller scale)
- Responsive breakpoints matching existing patterns

## 4. Reading Time Estimates

**Problem:** No indication of story length. Reading time helps users decide what to read.

**Solution:**

**Calculation:** Use Liquid's `split` filter to count words: `story.body | split: ' ' | size`. Divide by 200 (average WPM), round up. Minimum 1 minute.

Since Liquid lacks a `ceil` function, use: `words | plus: 199 | divided_by: 200` to achieve round-up behavior.

**Display locations:**
- Homepage featured story meta line: `By Jane Doe · March 15, 2026 · 5 min read`
- Homepage story card meta lines: same format
- Story detail page meta line: same format
- Section page lead story and card meta lines: same format
- "More from section" cards: same format

**Styling:** Inherits existing meta text styling (`--font-sans`, `--text-xs`, `--color-text-secondary`, uppercase). No additional CSS needed — it's just appended text.

**Files changed:** `pages/index.liquid`, `pages/story.liquid`, `pages/section.liquid`

## Architecture Notes

### No new JavaScript

All features are pure Liquid templates + CSS. No client-side filtering or dynamic behavior needed.

### Template variable access patterns

- Homepage (`index.liquid`): accesses `stories` (array), `sections` (array), `publication`
- Story detail (`story.liquid`): `stories` refers to the current story object (not the array). Other collections (`sections`, `publication`) should remain accessible. Access to sibling stories is an open question — see Section 3 for the assumption and fallback.
- Section page (`section.liquid`): `sections` refers to the current section object. `stories` should be accessible as the full array (since it's a different collection). `publication` remains accessible.

### Edge cases

- Section with 0 stories: show section header with "No stories yet" message
- Section with 1 story: show lead story only, no grid
- Story not matching any section: breadcrumb shows "Home / Story Title" (no section link)
- Very long story titles in breadcrumb: truncate with CSS `text-overflow: ellipsis`, max-width constraint
- Reading time for very short content (< 200 words): show "1 min read"

## Design Decisions

- **Section pages mirror the homepage pattern** rather than introducing a new layout. This keeps the design language consistent and reduces CSS complexity.
- **No author pages in this round.** Author names remain plain text. Can be added in a future round.
- **No search or filtering.** The section pages provide categorical browsing, which is sufficient for a publication with a moderate number of stories.
- **Reading time uses 200 WPM** as the standard reading speed. This is a widely-used convention (Medium uses 265, but 200 is more conservative and accounts for denser editorial content).
