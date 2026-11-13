# Archival website templates — conventions

This repo holds the content templates for the Archival editor, each on its own
`templates/<slug>-N` branch. The `templates/new` branch is the starter: it
already builds, and it already implements every convention below, so a new
template starts as a branch off `templates/new` and replaces its look and
schema. The editor lists templates from
`~/Repos/archival/archival-editor/objects/templates/<slug>.toml`.

This file documents the conventions every template should honor — refined
across an audit of all 12 templates. When adding a new template (or starting
a fresh branch), use this as the checklist.

Two other sources sit beside this file. The Archival MCP connector's
`archival_reference` tool (topics `authoring`, `conventions`, `local`) is the
official syntax reference; it is written for end-user sites, and this file
wins where the two differ for templates. The editor's `TemplateDefinition` in
`editor/src/templates.rs` is the truth for which `archival_template.toml`
fields are read.

---

## 1. Required elements every template must have

### Meta + SEO

Every page should render the full social-card suite. The boilerplate pattern
lives in `layout/theme.liquid`. The identity object is `[site]` in new
templates (older templates use `personal`, `app`, `band`, `info`, and so on):

```liquid
{% assign site_name = objects.<singleton>.name %}
{% assign canonical_url = site_url | append: "/" | append: path %}
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
- `<link rel="canonical" href="{{ canonical_url }}">` and
  `<meta property="og:url" content="{{ canonical_url }}">`: absolute, the
  page's own URL, no `.html`. Built from the `path:` layout argument (see
  "Layout arguments" below), never from `page`, which is the template's name
  on every item of a templated type.
- `{% if noindex %}<meta name="robots" content="noindex">{% endif %}` for
  utility pages (404, thank-you, search results)
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
{% capture jsonld_name %}{{ ...name | replace: '\', '\\' | replace: '"', '\"' | replace: '</', '<\/' | strip_newlines }}{% endcapture %}
```

Conditional fields use Liquid's `{%- if X != blank -%}, "key": "..."{%- endif -%}`
inline so trailing-comma issues don't appear when an optional field is missing.

JSON-LD goes in the `<head>` of the home page and of every templated page.
A page builds its block with `capture` and hands it to the layout, which
prints it inside `<head>`:

```liquid
{%- capture jsonld -%}
<script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "BlogPosting", "headline": "{{ ld_title }}" }
</script>
{%- endcapture -%}
{% layout 'theme' title: post.title, path: post.path, jsonld: jsonld %}
```

The starter's `pages/index.liquid` ships a generic `WebSite` block; replace
the type with the one from the table above. Check that every built block
parses as JSON.

### Layout arguments

Every page calls the layout with `title:` and `path:`. `noindex:` and
`jsonld:` are optional, and the layout tests them with a bare
`{% if noindex %}`, which tolerates an argument that was never passed.

| Page | Call |
|---|---|
| Home | `{% layout 'theme' title: "", path: "", jsonld: jsonld %}` |
| Section page | `{% layout 'theme' title: "About", path: "about" %}` |
| Templated item | `{% layout 'theme' title: post.title, path: post.path, jsonld: jsonld %}` |
| 404 | `{% layout 'theme' title: "Page Not Found", path: "404", noindex: true %}` |

### Favicon

The identity object carries `favicon = "image"`. The layout uses it when it
is set, and otherwise falls back to an SVG of the site name's initials on a
dark rounded square with the Archival accent yellow:

```liquid
{% if objects.<singleton>.favicon != blank %}
<link rel="icon" href="{{ objects.<singleton>.favicon.url }}">
<link rel="apple-touch-icon" href="{{ objects.<singleton>.favicon.url }}">
{% else %}
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,…{{ initials }}…">
{% endif %}
```

Build `initials` with `words.first`, not `words[0]`: archival's Liquid has
no bracket indexing. The full snippet is in the starter's
`layout/theme.liquid`.

### Fonts

Previews render on an Ubuntu box, where a bare `system-ui` stack resolves to
a very different face than on macOS or Windows. Every template uses this
body/UI stack:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text",
  "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
```

Inter is self-hosted, never pulled from Google Fonts:
`public/fonts/inter-variable.woff2` and `public/fonts/inter-variable-italic.woff2`
(the variable latin subset from `@fontsource-variable/inter`), declared with
two `@font-face` rules using `font-weight: 100 900` and `font-display: swap`.
A template that leads with a brand display face keeps it first and uses this
stack as the tail.

### Computer-facing pages

Feed readers, search engines and AI agents read the site too. Each of these
is a Liquid page whose second extension sets the output type, generated from
the objects (a loop over what it lists, never text written out by hand):

- `pages/llms.txt.liquid`: every template. What the site is, its main pages
  and its kinds of content, from the identity object and the lists.
- `pages/sitemap.xml.liquid`: every page and every templated item as an
  absolute URL without `.html`, the same URLs the canonical links use.
  Leaves out the 404 page and every `noindex` page.
- `pages/robots.txt.liquid`: allows all and names the sitemap.
- `pages/feed.xml.liquid`: whenever there is a dated list, linked from the
  layout's `<head>` with
  `<link rel="alternate" type="application/rss+xml" title="…" href="{{ site_url }}/feed.xml">`.

The starter ships the first three with commented loops to fill in. Their
URLs are relative until `site_url` is set at claim time, which is expected.

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
- Respect `prefers-reduced-motion` — global media query in CSS plus
  short-circuits in motion-heavy scripts:
  ```ts
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

The starter's `pages/404.liquid` is plain HTML with inline styles and no
Liquid, so it builds under whatever layout and schema replace the starter's.
A template replaces it with the same shape across the campaign:

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
- `archival.toml` shipping with `site_url = "https://theatre.onarchival.dev"`.

Anything specific (brand voice prose, hardcoded URLs, API keys,
example addresses) belongs in the **default data files**, not in the
template logic. Default data is editable; template logic isn't.

---

## 3. Liquid + liquid-rs gotchas

### `{% if X != blank %}` is the canonical idiom

Not `{% if X %}` (truthy) and not `{% if X != empty %}` (which is
intended for arrays). `!= blank` works for strings, nil, missing
fields, and gives consistent behavior across the codebase.

### Pages must explicitly pass `title:` and `path:`

liquid-rs errors on undefined-variable references in expressions like
`{% if title != blank %}`. Every page must pass a title even if it's
empty, and a `path:` for the canonical URL (see "Layout arguments" in
Section 1):

```liquid
{% layout 'theme' title: "", path: "" %}                   {# index page  #}
{% layout 'theme' title: "About", path: "about" %}         {# section page #}
{% layout 'theme' title: post.title, path: post.path %}    {# detail page  #}
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
{% capture x %}{{ value | replace: '\', '\\' | replace: '"', '\"' | replace: '</', '<\/' | strip_newlines }}{% endcapture %}
"key": "{{ x }}"
```

Every string interpolated into JSON inside a `<script>` (JSON-LD or a
data block) goes through this chain — URLs included, since upload
filenames are user-chosen. The `</` replacement keeps a value containing
`</script>` from ending the block early; `<\/` is a valid JSON escape.

### Output is not HTML-escaped

archival's Liquid writes values out raw, so a `"` in a title ends a
`content="…"` attribute early and a `<` starts a tag. Pipe every `string`
field through `| escape` where it lands in HTML, attributes included:
`content="{{ page_title | escape }}"`, `<h1>{{ post.title | escape }}</h1>`.
Leave `markdown` fields alone (they are already HTML), and use the JSON
escape chain below, not `escape`, inside `<script>` blocks. Most of the
older templates predate this rule.

### A field the schema doesn't define fails on any reference

archival treats two cases differently. A field defined in
`archival_objects.toml` but missing from the data is nil, and
`{% if x.field != blank %}` handles it. A field the schema does not define
at all fails the build on *any* reference, including inside an `if`
(`liquid: Unknown index ... requested index=description`).

This matters most on `templates/new`: the editor's from-scratch flow starts
from it, replaces the schema and rewrites the layout and home page, but
keeps the other starter pages. Any page it keeps (`llms.txt`, `sitemap.xml`,
`robots.txt`) must not name a schema field directly, and `404` stays free of
Liquid altogether. Read optional fields by looping over the object instead:

```liquid
{% for field in objects.site %}{% if field.first == "description" %}{{ field.last }}{% endif %}{% endfor %}
```

The editor's `src/test/infer-script.test.ts` builds the starter this way.

### Singleton-vs-collection access ambiguity

In templates rendering an object via `template = "..."`, the bare
collection name (e.g. `sections`, `stories`, `services`) resolves to
the **current item** not the collection. To iterate all items from
inside a per-object page template, use `objects.<name>` explicitly:

```liquid
{% for section in objects.sections %}
```

New templates name every type in the singular (`[post]`, never `[posts]`),
as the official docs require: a plural root object can't be addressed by its
own name. On `pages/post.liquid` the current item is `post`, and the whole
list is `objects.post`.

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

`archival_editor.toml` configures how each collection appears in the
editor list view. Every list type and every nested child list gets a
view, and the one or two lists people will add to most get a shortcut:

```toml
[[<collection>.views]]
name = "default"
primary = "<field>"
secondary = "<field>"

[[shortcuts]]
name = "New Post"
path = "post"
```

`primary`, `secondary` and `tertiary` name fields of that type, or
`filename`. A shortcut's `path` is the type name for a top-level list, or
`<root>.<child>` for a child list on a root object.

---

## 5. Scripts

All JavaScript is TypeScript in `scripts/`, which archival (0.26+)
builds itself: `scripts/carousel.ts` is served at `/js/carousel.js`
with its types stripped. There is no bundler, no `package.json` and no
`prebuild` — the editor's previews never run `prebuild`, so anything a
template needs must come out of `archival build` alone.

- Load scripts as modules: `<script type="module" src="/js/carousel.js"></script>`.
  The one exception is a script that must run before first paint
  (e.g. applying a stored theme): load it as a blocking classic
  `<script src="/js/theme-init.js"></script>` in `<head>`, and give that
  file no `import`/`export`.
- No inline `<script>` code in layouts or pages — put it in a module and
  load it only on the pages that need it. JSON-LD stays inline.
- Data that liquid renders for a script goes in a JSON block, read with
  `JSON.parse(document.getElementById("…")!.textContent!)`. Escape strings
  with the pattern from "No `json` filter" above, and check that the
  built JSON parses:
  ```liquid
  <script type="application/json" id="tracks-data">
  [{% for t in objects.track %}{"title": "{{ t.title | replace: '\', '\\' | replace: '"', '\"' | replace: '</', '<\/' | strip_newlines }}"}{% unless forloop.last %},{% endunless %}{% endfor %}]
  </script>
  ```
- Only TypeScript that erases: no `enum`, `namespace` or constructor
  parameter properties. Use `import type` for types, and import local
  modules by their built name (`./util.js`). Nothing is bundled, so bare
  npm imports don't work.
- Third-party libraries load from a CDN. Import an ES module straight
  from its URL and type what you use with `declare module "<url>"` in a
  `scripts/*.d.ts`; declare a classic script's globals in
  `scripts/globals.d.ts`.
- Every template ships the same strict `tsconfig.json` (copy it from
  any template with scripts), and `tsc -p tsconfig.json` must pass.
  archival strips types but doesn't check them.

Carriers are TypeScript too: carrier API version 2
(`"archival": { "carrier": 2 }` in the carrier's `package.json`), typed
with the `@archival/carrier` dev dependency. See blog-1 and
professional-1.

---

## 6. Per-deployment config

`archival.toml` should **not** ship with `site_url` set — that's a
per-deployment value the user fills in after deploying. Templates
that ship with `site_url = "https://demo.example.com"` accidentally
canonicalize every user's site to the demo URL.

It **does** set `upload_prefix = "archival-template-uploads/"`, so the
default media a template ships with (uploaded images, video, audio)
resolves in previews. The platform rewrites it when a site is claimed.
This is the one place templates deliberately differ from the official
docs, which tell end-user sites to leave `upload_prefix` alone.

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

The other fields, as the editor reads them:

- `name`: shown in the template picker.
- `tagline`: one line for the gallery card, roughly ten to fifteen words.
  Missing from the public schema, but the editor reads it and falls back
  to `description` without it.
- `description`: the template info modal's body, long and specific.
- `tags`, `tlds`, `keep_objects` (value paths kept when a site is
  generated, instead of stripped as example content).
- `[skin]`: optional. A contract declaring which `:root` variables an
  automated recoloring pass may change, with ranges and derivations. See
  app-1 and app-2; templates without one are never skinned.

Every Archival TOML file starts with its schema hint:

```toml
#:schema https://archival.dev/schemas/archival_template.schema.json
```

(`manifest`, `archival_objects` and `archival_editor` schemas live at the
same path.)

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
- [ ] `prefers-reduced-motion` respected in CSS and any script that
      drives motion
- [ ] All JS is TypeScript in `scripts/` (no `.js` in `public/`, no
      inline `<script>` code), and `tsc -p tsconfig.json` passes —
      see Section 5
- [ ] Every `markdown`-typed field is rendered inside a
      `<div class="markdown">` wrapper, and the stylesheet ships a
      comprehensive `.markdown { ... }` block covering every element
      (h1–h6, lists, code/pre with Prism colors, blockquote, table,
      hr, img, anchor reset) — see Section 1
- [ ] All CSS dimensions in rem, no `px` (even for hairlines)
- [ ] Footer year is `{{ "now" | date: "%Y" }}`, not hardcoded
- [ ] `archival.toml` does **not** set `site_url` (left for the user
      to configure)
- [ ] No hardcoded brand-specific copy (search the layout for the
      placeholder business name and confirm it only appears in
      `objects/*.toml`)
- [ ] LLM context in `archival_template.toml` matches the current
      schema
- [ ] `objects/<singleton>.toml` does **not** carry `order = -1`
      legacy patterns or other dead fields
- [ ] `archival_template.toml` has a `name`, `tagline`, `description`
      and `context`
- [ ] Identity object has `og_image` and `favicon` image fields
- [ ] Inter self-hosted and the standard font stack in use
- [ ] Every page has a canonical link built from `path:`, and utility
      pages pass `noindex: true`
- [ ] `llms.txt`, `sitemap.xml` and `robots.txt` generated from the
      objects; `feed.xml` too when there is a dated list
- [ ] Every list type and nested child list has a view in
      `archival_editor.toml`

Most of this is mechanical. Run it after `rm -rf dist && archival build .`
and fix every line it prints:

```bash
test -f dist/llms.txt || echo "no llms.txt"
test -f dist/sitemap.xml || echo "no sitemap.xml"
test -f dist/robots.txt || echo "no robots.txt"
[ -f dist/feed.xml ] && { grep -q 'rel="alternate"' dist/index.html || echo "feed not linked from layout"; }
grep -Eq '\.html</loc>|/404</loc>' dist/sitemap.xml 2>/dev/null && echo "sitemap lists .html or 404 URLs"
grep -q 'content="noindex"' dist/404.html || echo "404 page is not noindex"
for f in $(find dist -name '*.html'); do
  for needle in '<title>' 'name="description"' 'rel="canonical"' 'property="og:title"' 'lang="en"' 'id="main"'; do
    grep -q "$needle" "$f" || echo "missing $needle: $f"
  done
  [ "$(grep -c '<h1' "$f")" = 1 ] || echo "h1 count is not 1: $f"
  grep -q 'href="#"' "$f" && echo "href=\"#\": $f"
  grep -Eq 'href="/[^"]*\.html"' "$f" && echo ".html link: $f"
  grep -q 'onclick=' "$f" && echo "onclick: $f"
done
for f in dist/index.html dist/*/*.html; do
  [ -f "$f" ] && { grep -q 'application/ld+json' "$f" || echo "no JSON-LD: $f"; }
done
for d in objects/*/; do [ -d "$d" ] || continue; t=$(basename "$d"); grep -q "^\[\[$t.views\]\]" archival_editor.toml || echo "no editor view: $t"; done
grep -rEn '[0-9.]+px' public --include='*.css' && echo "px units above"
grep -En '>[^<{%]{60,}<' pages/*.liquid layout/*.liquid
```

The last line is for judgment: every hit should be the 404 page or the
footer.

---

## 9. Where things live

- `archival_objects.toml` — schema (top-level field types per object)
- `objects/<name>.toml` — singleton data
- `objects/<name>/*.toml` — multi-file collection data (one file per
  item, an `order` field controls display order). `order` is built in:
  set it in each data file, and never declare it in
  `archival_objects.toml`, where it fails the build as a reserved field.
- `pages/*.liquid` — page templates; the file name (minus `.liquid`)
  becomes the URL slug
- `pages/_partial.liquid` — leading-underscore = include-only partial,
  used via `{% include 'partial-name' %}`
- `layout/theme.liquid` — wraps every page that uses `{% layout 'theme' %}`
- `public/**` — static files copied through to `dist/`
- `scripts/**/*.ts` — browser scripts, built to `/js/` (see Section 5)
- `tsconfig.json` — strict type-checking config for `scripts/`
- `archival.toml` — per-site config (`site_url`, etc.)
- `archival_template.toml` — template-level metadata + LLM-generation
  context
- `archival_editor.toml`: editor list views and shortcuts
- `objects/site.toml`: the identity object's data in new templates
- `pages/llms.txt.liquid`, `pages/sitemap.xml.liquid`,
  `pages/robots.txt.liquid`: computer-facing pages (Section 1)
- `public/fonts/`: self-hosted Inter

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
