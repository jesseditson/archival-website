# Archival website templates — conventions

This repo holds 12 content templates for the Archival editor, each on its own
`templates/<slug>-N` branch. `main` is the boilerplate starter; every template
branch is an orphan branch that descends from it.

This file documents the conventions every template should honor — refined
across an audit of all 12 templates. When adding a new template (or starting
a fresh branch), use this as the checklist.

---

## 1. Required elements every template must have

### Meta + SEO

Every page should render the full social-card suite. The boilerplate pattern
lives in `layout/theme.liquid`:

```liquid
{% assign site_name = objects.<singleton>.name %}
{% if title != blank %}
  {% assign page_title = title | append: " — " | append: site_name %}
{% else %}
  {% assign page_title = site_name %}
{% endif %}
{% assign og_image_url = "" %}
{% if objects.<singleton>.og_image != blank %}
  {% assign og_image_url = objects.<singleton>.og_image.url %}
{% elsif objects.<singleton>.<fallback_image> != blank %}
  {% assign og_image_url = objects.<singleton>.<fallback_image>.url %}
{% endif %}
```

Then in `<head>`:

- `<title>{{ page_title }}</title>` — em-dash (` — `) separator, **not** `|`
- `<meta name="description" content="{{ ...description }}">`
- `<meta name="author" content="{{ ...name }}">` (when relevant)
- `<meta property="og:title" content="{{ page_title }}">`
- `<meta property="og:description" content="...">`
- `<meta property="og:type" content="website|article|video.other|profile">`
- `<meta property="og:site_name" content="{{ site_name }}">`
- `<meta property="og:image" content="{{ og_image_url }}">` (conditional)
- `<meta name="twitter:card" content="summary_large_image">` when image,
  else `summary`
- `<meta name="twitter:title">` / `twitter:description` / `twitter:image`
- `<meta name="theme-color">` — preferably with light + dark variants via
  `media="(prefers-color-scheme: ...)"`

### JSON-LD

Pick the schema.org type that fits:

| Template kind          | Type                                       |
|------------------------|--------------------------------------------|
| About / personal       | `Person`                                   |
| App                    | `MobileApplication`                        |
| Band / musician        | `MusicGroup`                               |
| Bar / restaurant       | `Restaurant`                               |
| Blog                   | `Blog` on home, `BlogPosting` on posts     |
| Photographer / creator | `Person`                                   |
| Professional services  | `ProfessionalService`                      |
| Publication / news     | `NewsMediaOrganization` / `NewsArticle`    |
| Small business         | `LocalBusiness`                            |
| Video / theatre        | `VideoObject`                              |

Liquid-rs has **no `json` filter** — escape strings via the
`replace + strip_newlines` pipe pattern:

```liquid
{% capture jsonld_name %}{{ ...name | replace: '\', '\\' | replace: '"', '\"' | strip_newlines }}{% endcapture %}
```

Conditional fields use Liquid's `{%- if X != blank -%}, "key": "..."{%- endif -%}`
inline so trailing-comma issues don't appear when an optional field is missing.

### Auto-generated SVG favicon

Every template uses the same favicon snippet (initials of the site name on a
dark rounded square with the Archival accent yellow):

```liquid
{% assign words = objects.<singleton>.name | split: " " %}
{% assign initials = "" %}
{% if words.size == 1 %}
  {% assign initials = words[0] | slice: 0, 2 | upcase %}
{% else %}
  {% for word in words limit: 2 %}
    {% assign letter = word | slice: 0, 1 | upcase %}
    {% assign initials = initials | append: letter %}
  {% endfor %}
{% endif %}
{% assign initials = initials | replace: "&", "" | replace: "<", "" | replace: ">", "" | replace: "'", "" | replace: '"', "" %}
<link rel="icon" type="image/svg+xml"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23111'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-family='system-ui,sans-serif' font-weight='bold' font-size='13' fill='%23e5ff00'%3E{{ initials }}%3C/text%3E%3C/svg%3E">
```

### Accessibility

- `<html lang="en">` — never empty, never `class="no-js"` unless paired
  with JS that removes it
- Skip-to-content link as the **first** child of `<body>`:
  ```html
  <a class="skip-link" href="#main">Skip to content</a>
  ```
- `<main id="main">` wrapping `{{ page_content }}` (in the layout) **or**
  on every page individually — whichever fits the structure. Never nest
  `<main>` elements.
- Exactly one `<h1>` per page. If a layout has a brand h1 (masthead),
  conditionally demote it to a `<p>` or `<div>` on subpages so the page's
  own content owns the h1.
- Buttons that toggle UI state get `aria-expanded` and (where relevant)
  `aria-controls`.
- Keyboard support: any element with click handlers should also accept
  Escape to close (mobile menus, lightboxes, etc.).
- Decorative images use `alt=""`; meaningful images use a description
  pulled from the schema.
- Respect `prefers-reduced-motion` — global media query in CSS plus JS
  short-circuits in motion-heavy code:
  ```js
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;
  ```

### Footer attribution

Every template footer ends with:

```html
<p>&copy; {{ "now" | date: "%Y" }} {{ ...name }}. Powered by
   <a href="https://archival.dev">Archival</a>.</p>
```

The year is **always** `{{ "now" | date: "%Y" }}` — never a hardcoded
`2024`/`2025`/`copyright_year` schema field. (The `copyright_year` field
was a recurring dead-schema-field bug we removed from multiple templates.)

Style the Archival link to fit the template's palette — typically a
slightly brighter shade than surrounding muted text, with a hover
transition to full brightness.

### 404 page

Same shape across the campaign:

```liquid
{% layout 'theme' title: 'Page Not Found' %}
<section id="not-found">
  <p class="not-found-eyebrow">Page Not Found</p>
  <p class="not-found-code">404</p>
  <h2 class="not-found-title">This page took a wrong turn.</h2>
  <p class="not-found-description">
    The page you were looking for doesn't exist. It may have moved,
    been renamed, or never been here at all.
  </p>
  <a href="/" class="not-found-cta">Take me home</a>
</section>
```

CSS scoped under `#not-found` so generic body / paragraph rules don't
override `.not-found-code`'s `clamp()` font size. Adapt the colors to
the template's palette but keep the eyebrow / oversized code / italic
or serif headline / outlined CTA structure.

### Markdown content styling

Any field of type `markdown` in the schema can render arbitrary
markdown — headings, lists, code, tables, blockquotes, etc. Every
template must:

1. **Wrap each markdown render site in `<div class="markdown">`** so
   styling targets the wrapper, not bare element selectors. Existing
   surface classes can stack:
   `<div class="about-text markdown">{{ about.description }}</div>`.
   If the markdown emits `<p>` and the wrapper was already a `<p>`,
   change it to a `<div>` to avoid invalid nested-paragraph HTML.

2. **Include a comprehensive `.markdown { ... }` CSS block** covering
   every supported element (h1–h6, p, strong, em, a, code, pre,
   blockquote, ul/ol/li, hr, img, table) plus Prism token colors
   (kept for parity even when Prism isn't loaded). Use the template's
   design tokens (CSS custom properties) so the block respects the
   palette. The block belongs at the **end** of the stylesheet so its
   element-scoped rules win over earlier defaults via source order.

3. **Reset `text-align: left` on `.markdown`** so rendered prose isn't
   accidentally centered when the wrapping surface uses
   `text-align: center` (hero areas, host cards, etc.).

4. **Override the heading anchor link** that the markdown filter
   injects: `.markdown h1 a.anchor, ... { border-bottom: none; color:
   inherit; text-decoration: none; }`. Otherwise heading anchors pick
   up the link styling.

5. **Code blocks should always render dark** even on light themes
   (hardcoded dark background and light text, not `var(--color-text)`).
   Without this, themes that swap `--color-text` between light/dark
   end up with white-on-white code blocks in the wrong mode.

6. **Tables should be contained rounded rectangles** with a shaded
   header row, soft shadow, and `overflow: hidden` on the table. The
   newspaper-style top/bottom-border-only look reads as broken in
   most templates.

Reference: any of the worked branches (`templates/about-1`,
`templates/photographica-1`, `templates/publication-1`, etc.) ships a
fully fleshed-out `.markdown` block to crib from.

### CSS units: always rem, never px

Use rem for every dimensional property — padding, margin, border-width,
border-radius, box-shadow offsets, scrollbar height, hr height,
everything. Conversion: `1rem = 16px` (so `1px → 0.0625rem`,
`4px → 0.25rem`, `8px → 0.5rem`, `24px → 1.5rem`). This keeps the UI
honoring the user's font-size preferences and keeps scaling consistent
across the template.

Don't introduce px even for "hairline" borders or shadow offsets.
Existing px in unrelated rules don't need to be retroactively changed
unless touching that rule.

---

## 2. Schema patterns

### Use child collections for list-shaped data

Plain `string` fields render in the editor as a single-line text input.
For anything list-shaped (tags, menu categories, hours rows, FAQ
entries, contact methods, etc.) prefer a child collection — the editor
renders it as a repeatable group with add/remove/reorder buttons.

```toml
[parent.child]
name = "string"
```

with data like:
```toml
[[parent.child]]
name = "First entry"
[[parent.child]]
name = "Second entry"
```

Nested grand-children also work (e.g. `[work.project.tag]` inside
`[[work.project]]`).

### Use real types

- `boolean` — for toggles. Editor renders a checkbox. Don't fake it
  with a string field that holds `"yes"`/`"no"`.
- `enum` — `field = ["option-a", "option-b"]`. Editor renders a
  dropdown. Useful for fixed choices that don't change at runtime.
- `image`, `audio`, `video`, `upload` — for files (editor renders an
  upload widget). The optional `og_image = "image"` field on the
  identity singleton is the canonical override for social-share
  preview images.

### `og_image` field

Every template's identity singleton (`personal`, `app`, `band`, `site`,
`info`, `publication`) should have an `og_image = "image"` field. The
layout falls back from `og_image` → the template's primary image
(`logo`, `hero_image`, `image`, etc.) when blank.

### Optional sections via `show_*` booleans

Where users might legitimately want to hide a section without deleting
the underlying data, add a `show_<section>` boolean on the parent
singleton. Default `true`. Templates check both:

```liquid
{% if X.show_<section> != false and X.<collection>.size > 0 %}
```

so the section also auto-hides when the collection is empty.

`{% if X.show_Y != false %}` (instead of `{% if X.show_Y %}`) lets
nil/missing booleans default to "show", so older data files without
the field still render correctly.

### No hardcoded brand-specific data in the layout

The single worst class of bug we found across the campaign was
hardcoded brand-specific copy / URLs / API keys / paragraphs leaking
out of the default data into the layout itself, where they shipped to
every user's site. Examples we caught:

- `<meta name="keywords" content="Pale Stations, indie rock, ...">`
  — bands shipped with the demo band's name in their site's meta.
- Two paragraphs of editorial copy ending with the literal phrase
  "The Gilded Hour" inside `pages/index.liquid` of bar-restaurant.
- Hardcoded NYC fallback address `"20 W 34th St, New York, NY 10001"`
  in the `default:` filter when the user's address was blank.
- Hardcoded Google Maps Embed API key tied to someone's billing
  account.
- `manifest.toml` shipping with `site_url = "https://theatre.onarchival.dev"`.

Anything specific (brand voice prose, hardcoded URLs, API keys,
example addresses) belongs in the **default data files**, not in the
template logic. Default data is editable; template logic isn't.

---

## 3. Liquid + liquid-rs gotchas

### `{% if X != blank %}` is the canonical idiom

Not `{% if X %}` (truthy) and not `{% if X != empty %}` (which is
intended for arrays). `!= blank` works for strings, nil, missing
fields, and gives consistent behavior across the codebase.

### Pages must explicitly pass `title:`

liquid-rs errors on undefined-variable references in expressions like
`{% if title != blank %}`. Every page must pass a title even if it's
empty:

```liquid
{% layout 'theme' title: "" %}              {# index page  #}
{% layout 'theme' title: "About" %}         {# section page #}
{% layout 'theme' title: post.title %}      {# detail page  #}
```

Bare truthy `{% if title %}` does work on undefined, but `!= blank`
doesn't. Be consistent — passing `title: ""` everywhere keeps the
plumbing simple.

### Markdown link URLs can't contain Liquid

Markdown's URL portion gets URL-encoded **before** Liquid evaluates
the template, so `[label]({{site_url}}/path.html)` ships as
`<a href="%7B%7Bsite_url%7D%7D/path.html">` — broken forever. Use
relative URLs (`/path.html`) or hardcoded absolute URLs in markdown
content fields.

Liquid in markdown **text** (between `[...]` brackets, in paragraphs,
etc.) works fine — it's only the URL-encoded portions that break.

### No `json` filter — escape manually

```liquid
{% capture x %}{{ value | replace: '\', '\\' | replace: '"', '\"' | strip_newlines }}{% endcapture %}
"key": "{{ x }}"
```

### Singleton-vs-collection access ambiguity

In templates rendering an object via `template = "..."`, the bare
collection name (e.g. `sections`, `stories`, `services`) resolves to
the **current item** not the collection. To iterate all items from
inside a per-object page template, use `objects.<name>` explicitly:

```liquid
{% for section in objects.sections %}
```

### `{% unless %}` works but doesn't always have `{% else %}`

Some Archival liquid versions don't support `{% unless %}{% else %}{% endunless %}`.
When you need an else branch, use `{% if X != blank %}...{% else %}...{% endif %}` instead.

### Footer paragraph margins

Browser default `<p> { margin-block-start: 1em; margin-block-end: 1em }`
**stacks on top of** explicit `margin-bottom: X`, so footer rows that
mix `<br>`-driven line breaks (e.g. `address | replace_first: ", ", "<br>"`)
and separate `<p>` items get visibly inconsistent rhythm. Reset with
`margin: 0 0 X` to zero out the top margin.

---

## 4. Editor compatibility

Verified in the editor's source (Rust + TS):

- Plain `string` → single-line text input (no comma-list smarts —
  prefer child collections for list-shaped data).
- `boolean` → checkbox.
- `enum` (`field = ["a", "b"]`) → dropdown. Static; users can't add
  options at runtime, so reach for child collection if the option
  list might grow.
- `image` / `upload` / `audio` / `video` → file upload widget.
- Child collections (`[parent.child]` schema + `[[child]]` data) →
  repeatable group with add / remove / reorder.
- Grand-child collections (e.g. `[parent.child.grandchild]` inside
  `[[parent.child]]`) work too — render as nested repeatable groups.

`archival_editor.toml` can configure how each collection appears
in the editor list view:

```toml
[[<collection>.views]]
name = "default"
primary = "<field>"
secondary = "<field>"
```

---

## 5. Build pipelines

For templates that need a build step (e.g. TypeScript compiled by
esbuild), use `manifest.toml`'s `prebuild` array:

```toml
prebuild = ["npm ci", "npm run build:js"]
```

These commands run before `archival build`. **Important**: build outputs
that need to be served must land in `public/` — `archival build`
rebuilds `dist/` on every run, wiping anything written there directly
(theatre-1 had this exact bug — esbuild was outputting to
`dist/scripts/main.js` and the page was always 404'ing the JS).

Gitignore the build artifact (`public/scripts/main.js` etc.) so it's
regenerated on every build rather than tracked.

---

## 6. Per-deployment config

`manifest.toml` should **not** ship with `site_url` set — that's a
per-deployment value the user fills in after deploying. Templates
that ship with `site_url = "https://demo.example.com"` accidentally
canonicalize every user's site to the demo URL.

The RSS feed and similar outputs that need an absolute URL pull from
`{{ site_url }}` — they'll have empty `<link>` elements until the user
configures their manifest. Document this in the template README.

---

## 7. LLM-generation context (`archival_template.toml`)

The `context = """ ... """` block is the prompt that drives content
generation when users add a template via the editor. **Update this
when the schema changes.** Common drift we caught:

- Schema migrated from a comma-separated `tags = "string"` to a
  `[[tag]]` child collection, but the LLM context still said
  "comma-separated tags" — so generated content didn't match the
  schema.
- `featured = "string"` migrated to `featured = "boolean"`, but the
  context still said `"yes"`/`"no"` strings.
- New optional fields (`og_image`, `description`, etc.) need to be
  documented so the LLM either fills them or leaves them blank
  appropriately.

If the schema lives somewhere stable, link to it:

```toml
#:schema https://raw.githubusercontent.com/jesseditson/archival/refs/heads/toml_schemas/archival_template.schema.json
```

---

## 8. Things to check before merging a new template

A short pre-flight checklist:

- [ ] Build cleanly with `archival build` from a fresh checkout (no
      `node_modules`, no `dist`)
- [ ] `<title>` + OG/Twitter meta + JSON-LD all populated on every
      page
- [ ] Skip-link target (`#main`) resolves on every page
- [ ] No `href="#"` in rendered HTML (run `grep -c 'href="#"' dist/**/*.html`)
- [ ] No `onclick=` in rendered HTML
- [ ] `lang="en"` on `<html>`, no `class="no-js"` (unless the JS
      removes it)
- [ ] `<meta name="theme-color">` set, ideally with light/dark
      variants
- [ ] 404 page redesigned (not the bare default)
- [ ] `prefers-reduced-motion` respected in CSS and any JS that
      drives motion
- [ ] Every `markdown`-typed field is rendered inside a
      `<div class="markdown">` wrapper, and the stylesheet ships a
      comprehensive `.markdown { ... }` block covering every element
      (h1–h6, lists, code/pre with Prism colors, blockquote, table,
      hr, img, anchor reset) — see Section 1
- [ ] All CSS dimensions in rem, no `px` (even for hairlines)
- [ ] Footer year is `{{ "now" | date: "%Y" }}`, not hardcoded
- [ ] `manifest.toml` does **not** set `site_url` (left for the user
      to configure)
- [ ] No hardcoded brand-specific copy (search the layout for the
      placeholder business name and confirm it only appears in
      `objects/*.toml`)
- [ ] LLM context in `archival_template.toml` matches the current
      schema
- [ ] `objects/<singleton>.toml` does **not** carry `order = -1`
      legacy patterns or other dead fields

---

## 9. Where things live

- `objects.toml` — schema (top-level field types per object)
- `objects/<name>.toml` — singleton data
- `objects/<name>/*.toml` — multi-file collection data (one file per
  item, an `order` field controls display order)
- `pages/*.liquid` — page templates; the file name (minus `.liquid`)
  becomes the URL slug
- `pages/_partial.liquid` — leading-underscore = include-only partial,
  used via `{% include 'partial-name' %}`
- `layout/theme.liquid` — wraps every page that uses `{% layout 'theme' %}`
- `public/**` — static files copied through to `dist/`
- `manifest.toml` — per-site config (`site_url`, `prebuild`, etc.)
- `archival_template.toml` — template-level metadata + LLM-generation
  context

---

## 10. Additional references in this checkout

These memory files (under `.claude/`) capture more detail on specific
patterns:

- `feedback_archival_singleton_access.md` — singleton vs collection
  access patterns
- `feedback_archival_editor_field_rendering.md` — what each field
  type renders as in the editor
- `feedback_archival_markdown_link_urls.md` — the markdown URL
  encoding bug
- `feedback_archival_object_access.md` / `_array_indexing.md` /
  `_nil_image_access.md` — defensive access patterns

If working from a fresh clone without those memories, the patterns in
this CLAUDE.md should be sufficient.
