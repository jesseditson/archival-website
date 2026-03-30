# Publication UX Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken navigation, make images clickable, add section pages, story detail navigation, and reading time estimates to the publication template.

**Architecture:** All changes are pure Liquid templates + CSS. No JavaScript additions. Section pages are generated via Archival's `template` mechanism. Reading time is calculated server-side using Liquid filters. A key risk is nav rendering on section pages — the plan includes a verification step and fallback.

**Tech Stack:** Liquid templates, CSS, Archival static site generator, TOML data files

**Spec:** `docs/superpowers/specs/2026-03-30-publication-ux-round-2-design.md`

---

## Important: Archival Variable Naming Convention

In Archival, template pages access the current object via the **collection name** from `objects.toml`, NOT the template name:
- In `pages/story.liquid`: use `stories.headline` (not `story.headline`)
- In `pages/section.liquid`: use `sections.name` (not `section.name`)

On template detail pages, the owning collection name refers to the single current object. Other collections remain as arrays.

---

### Task 1: Foundation — Rename Section Files and Update Schema

**Files:**
- Rename: `objects/sections/1.toml` → `objects/sections/politics.toml`
- Rename: `objects/sections/2.toml` → `objects/sections/culture.toml`
- Rename: `objects/sections/3.toml` → `objects/sections/technology.toml`
- Rename: `objects/sections/4.toml` → `objects/sections/opinion.toml`
- Modify: `objects.toml:10-12`

**Why rename:** Archival generates page paths from filenames. Renaming from numeric IDs to slugs gives us clean URLs (`/sections/politics.html` instead of `/sections/1.html`) and lets us construct section URLs from story data using `story.section | downcase`.

- [ ] **Step 1: Rename section files to slug-based names**

```bash
cd /Users/alex/Repos/archival/archival-website
git mv objects/sections/1.toml objects/sections/politics.toml
git mv objects/sections/2.toml objects/sections/culture.toml
git mv objects/sections/3.toml objects/sections/technology.toml
git mv objects/sections/4.toml objects/sections/opinion.toml
```

- [ ] **Step 2: Add template property to sections in objects.toml**

In `objects.toml`, change the `[sections]` block from:

```toml
[sections]
name = "string"
slug = "string"
```

to:

```toml
[sections]
template = "section"
name = "string"
slug = "string"
```

This tells Archival to generate a page for each section object using `pages/section.liquid`.

- [ ] **Step 3: Create a minimal section page placeholder**

Create `pages/section.liquid`:

```liquid
{% layout 'theme' title: sections.name
  , page: 'section-page' %}

<div class="section-page">
  <h1>{{ sections.name }}</h1>
  <p>Section page placeholder</p>
</div>
```

This placeholder ensures the template is valid while we build out the full content in Task 3.

- [ ] **Step 4: Commit**

```bash
git add objects.toml objects/sections/ pages/section.liquid
git commit -m "Rename section files to slug-based names and add section template"
```

---

### Task 2: Clickable Story Images

**Files:**
- Modify: `pages/index.liquid:8-15` (featured image)
- Modify: `pages/index.liquid:38-44` (story card images)
- Modify: `public/styles.css` (hover effect)

- [ ] **Step 1: Wrap the featured story image in a link**

In `pages/index.liquid`, replace the featured image block (lines 8-15):

```liquid
        <div class="featured-image-wrap">
          {% if story.image %}
            <img class="featured-image" src="{{ story.image.url }}" alt="{{ story.image_caption }}">
          {% elsif story.cover_url != empty %}
            <img class="featured-image" src="{{ story.cover_url }}" alt="{{ story.image_caption }}">
          {% else %}
            <div class="featured-image-placeholder"></div>
          {% endif %}
        </div>
```

with:

```liquid
        <div class="featured-image-wrap">
          <a href="{{ story.path }}.html">
            {% if story.image %}
              <img class="featured-image" src="{{ story.image.url }}" alt="{{ story.image_caption }}">
            {% elsif story.cover_url != empty %}
              <img class="featured-image" src="{{ story.cover_url }}" alt="{{ story.image_caption }}">
            {% else %}
              <div class="featured-image-placeholder"></div>
            {% endif %}
          </a>
        </div>
```

- [ ] **Step 2: Wrap story card images in links**

In `pages/index.liquid`, replace the story card image block (lines 38-44):

```liquid
          {% if story.image %}
            <img class="story-card-image" src="{{ story.image.url }}" alt="{{ story.image_caption }}">
          {% elsif story.cover_url != empty %}
            <img class="story-card-image" src="{{ story.cover_url }}" alt="{{ story.image_caption }}">
          {% else %}
            <div class="story-card-image-placeholder"></div>
          {% endif %}
```

with:

```liquid
          <a href="{{ story.path }}.html">
            {% if story.image %}
              <img class="story-card-image" src="{{ story.image.url }}" alt="{{ story.image_caption }}">
            {% elsif story.cover_url != empty %}
              <img class="story-card-image" src="{{ story.cover_url }}" alt="{{ story.image_caption }}">
            {% else %}
              <div class="story-card-image-placeholder"></div>
            {% endif %}
          </a>
```

- [ ] **Step 3: Add image hover CSS**

In `public/styles.css`, add after the `.featured-image-placeholder` rule (after line 199):

```css
.featured-image-wrap a,
.story-card > a {
  display: block;
}

.featured-image-wrap a:hover img,
.story-card > a:hover img {
  opacity: 0.9;
}

.featured-image,
.story-card-image {
  transition: opacity 0.2s ease;
}
```

Note: Using `.story-card > a` (child combinator) targets only the direct image link, not section tag or headline links nested inside `<p>` and `<h3>` elements.

- [ ] **Step 4: Commit**

```bash
git add pages/index.liquid public/styles.css
git commit -m "Make story images clickable on homepage"
```

---

### Task 3: Section Page Template

**Files:**
- Modify: `pages/section.liquid` (replace placeholder with full template)
- Modify: `public/styles.css` (section page styles)

- [ ] **Step 1: Write the full section page template**

Replace the entire contents of `pages/section.liquid` with:

```liquid
{% layout 'theme' title: sections.name
  , page: 'section-page'
  , active_section: sections.name %}

<div class="section-page">
  <div class="section-page-header">
    <nav class="section-breadcrumb">
      <a class="breadcrumb-link" href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">{{ sections.name }}</span>
    </nav>
    <h1 class="section-page-name">{{ sections.name }}</h1>
    {% assign story_count = 0 %}
    {% for story in stories %}
      {% if story.section == sections.name %}
        {% assign story_count = story_count | plus: 1 %}
      {% endif %}
    {% endfor %}
    <p class="section-page-count">{{ story_count }} {% if story_count == 1 %}story{% else %}stories{% endif %}</p>
  </div>

  {% if story_count == 0 %}
    <p class="section-page-empty">No stories yet.</p>
  {% endif %}

  {% assign match_index = 0 %}
  {% for story in stories %}
    {% if story.section == sections.name %}
      {% if match_index == 0 %}
        <article class="section-lead-story">
          <div class="section-lead-image-wrap">
            <a href="/{{ story.path }}.html">
              {% if story.image %}
                <img class="section-lead-image" src="{{ story.image.url }}" alt="{{ story.image_caption }}">
              {% elsif story.cover_url != empty %}
                <img class="section-lead-image" src="{{ story.cover_url }}" alt="{{ story.image_caption }}">
              {% else %}
                <div class="section-lead-image-placeholder"></div>
              {% endif %}
            </a>
          </div>
          <div class="section-lead-text">
            <h2 class="section-lead-headline">
              <a href="/{{ story.path }}.html">{{ story.headline }}</a>
            </h2>
            {% if story.subheadline.size > 0 %}
              <p class="section-lead-subheadline">{{ story.subheadline }}</p>
            {% endif %}
            {% assign words = story.body | strip_html | split: ' ' | size %}
            {% assign reading_time = words | plus: 199 | divided_by: 200 %}
            {% if reading_time < 1 %}{% assign reading_time = 1 %}{% endif %}
            <p class="section-lead-meta">
              By {{ story.author }} &middot; {{ story.date }} &middot; {{ reading_time }} min read
            </p>
          </div>
        </article>
      {% endif %}
      {% assign match_index = match_index | plus: 1 %}
    {% endif %}
  {% endfor %}

  {% if story_count > 1 %}
    <div class="story-grid">
      {% assign match_index = 0 %}
      {% for story in stories %}
        {% if story.section == sections.name %}
          {% if match_index > 0 %}
            <article class="story-card">
              <a href="/{{ story.path }}.html">
                {% if story.image %}
                  <img class="story-card-image" src="{{ story.image.url }}" alt="{{ story.image_caption }}">
                {% elsif story.cover_url != empty %}
                  <img class="story-card-image" src="{{ story.cover_url }}" alt="{{ story.image_caption }}">
                {% else %}
                  <div class="story-card-image-placeholder"></div>
                {% endif %}
              </a>
              <p class="story-card-section">
                <a href="/sections/{{ story.section | downcase }}.html">{{ story.section }}</a>
              </p>
              <h3 class="story-card-headline">
                <a href="/{{ story.path }}.html">{{ story.headline }}</a>
              </h3>
              {% if story.subheadline.size > 0 %}
                <p class="story-card-subheadline">{{ story.subheadline }}</p>
              {% endif %}
              {% assign words = story.body | strip_html | split: ' ' | size %}
              {% assign reading_time = words | plus: 199 | divided_by: 200 %}
              {% if reading_time < 1 %}{% assign reading_time = 1 %}{% endif %}
              <p class="story-card-meta">
                By {{ story.author }} &middot; {{ story.date }} &middot; {{ reading_time }} min read
              </p>
            </article>
          {% endif %}
          {% assign match_index = match_index | plus: 1 %}
        {% endif %}
      {% endfor %}
    </div>
  {% endif %}
</div>
```

- [ ] **Step 2: Add section page CSS**

In `public/styles.css`, add after the `/* ---- Front Page Grid ---- */` section (after line 169, before the Featured Story comment):

```css
/* ---- Section Page ---- */

.section-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-xl) var(--space-2xl);
}

.section-page-header {
  text-align: center;
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid var(--color-rule-light);
  margin-bottom: var(--space-2xl);
}

.section-breadcrumb {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.breadcrumb-link {
  color: var(--color-accent);
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-sep {
  margin: 0 var(--space-sm);
  color: var(--color-rule-light);
}

.breadcrumb-current {
  color: var(--color-text-secondary);
}

.section-page-name {
  font-family: var(--font-serif);
  font-size: var(--text-4xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-xs);
}

.section-page-count {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.section-page-empty {
  text-align: center;
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  padding: var(--space-3xl) 0;
}

.section-lead-story {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2xl);
  padding-bottom: var(--space-2xl);
  border-bottom: 1px solid var(--color-rule-light);
  margin-bottom: var(--space-2xl);
  align-items: center;
}

.section-lead-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  transition: opacity 0.2s ease;
}

.section-lead-image-wrap a:hover img {
  opacity: 0.9;
}

.section-lead-image-placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--color-bg-warm);
}

.section-lead-headline {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-sm);
}

.section-lead-headline a:hover {
  color: var(--color-accent);
}

.section-lead-subheadline {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.section-lead-meta {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 3: Add section page responsive CSS**

In `public/styles.css`, inside the `@media (max-width: 900px)` block, add:

```css
  .section-lead-story {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .section-lead-headline {
    font-size: var(--text-2xl);
  }

  .section-page-name {
    font-size: var(--text-3xl);
  }
```

Inside the `@media (max-width: 600px)` block, add:

```css
  .section-page {
    padding: var(--space-xl) var(--space-md) var(--space-2xl);
  }

  .section-lead-headline {
    font-size: var(--text-xl);
  }

  .section-page-name {
    font-size: var(--text-2xl);
  }
```

- [ ] **Step 4: Commit**

```bash
git add pages/section.liquid public/styles.css
git commit -m "Add section page template with lead story and grid layout"
```

---

### Task 4: Update Nav Links and Active State

**Files:**
- Modify: `layout/theme.liquid:23-27` (nav section)
- Modify: `public/styles.css` (active nav style)

**Risk:** On section pages, `sections` is the current section object (not the array), which may break the `{% for section in sections %}` loop in the layout. This task includes a verification step.

- [ ] **Step 1: Update nav links to point to section pages**

In `layout/theme.liquid`, replace the nav block (lines 23-27):

```liquid
        <nav class="nav-sections">
          {% for section in sections %}
            <a class="nav-link" href="/#{{ section.slug }}">{{ section.name }}</a>
          {% endfor %}
        </nav>
```

with:

```liquid
        <nav class="nav-sections">
          {% if sections.slug %}
            {% assign nav_seen = "" %}
            {% for story in stories %}
              {% assign nav_slug = story.section | downcase %}
              {% assign nav_check = nav_slug | prepend: "|" | append: "|" %}
              {% unless nav_seen contains nav_check %}
                {% assign nav_seen = nav_seen | append: nav_check %}
                <a class="nav-link{% if story.section == active_section %} nav-link--active{% endif %}" href="/sections/{{ nav_slug }}.html">{{ story.section }}</a>
              {% endunless %}
            {% endfor %}
          {% else %}
            {% for section in sections %}
              <a class="nav-link{% if section.name == active_section %} nav-link--active{% endif %}" href="/sections/{{ section.slug }}.html">{{ section.name }}</a>
            {% endfor %}
          {% endif %}
        </nav>
```

**How this works:** The `{% if sections.slug %}` check detects if `sections` is a single object (section detail pages) versus an array (all other pages). On section pages, it derives section names from the `stories` array. On other pages, it iterates `sections` directly. Both paths produce identical links.

The `active_section` variable is passed from page templates via the layout call. On pages that don't pass it, no nav link gets the active class.

- [ ] **Step 2: Add active nav link CSS**

In `public/styles.css`, after the `.nav-link:hover` rule (after line 133):

```css
.nav-link--active {
  color: var(--color-accent);
  border-bottom: 2px solid var(--color-accent);
  padding-bottom: 2px;
}
```

- [ ] **Step 3: Build and verify**

Run the Archival build and check:
1. Homepage: nav links point to `/sections/{slug}.html` and display all 4 sections
2. Story detail page: nav links display all 4 sections (no active state)
3. Section page: nav links display all 4 sections with current section highlighted

If the nav breaks on section pages (empty nav bar or only one link), the `sections.slug` detection is not working as expected. In that case, try the alternative: replace `{% if sections.slug %}` with `{% if page == 'section-page' %}` — the `page` variable is passed via the layout call and should reliably indicate the page type.

- [ ] **Step 4: Commit**

```bash
git add layout/theme.liquid public/styles.css
git commit -m "Update nav links to point to section pages with active state"
```

---

### Task 5: Homepage — Section Tag Links and Reading Time

**Files:**
- Modify: `pages/index.liquid:17` (featured section tag)
- Modify: `pages/index.liquid:24-25` (featured meta)
- Modify: `pages/index.liquid:45` (card section tag)
- Modify: `pages/index.liquid:49-51` (card meta)

- [ ] **Step 1: Link the featured story section tag and add reading time**

In `pages/index.liquid`, replace the featured story text block (lines 17-26):

```liquid
        <div class="featured-text">
          <p class="featured-section">{{ story.section }}</p>
          <h2 class="featured-headline">
            <a href="{{ story.path }}.html">{{ story.headline }}</a>
          </h2>
          <p class="featured-subheadline">{{ story.subheadline }}</p>
          <p class="featured-meta">
            By {{ story.author }} &middot; {{ story.date }}
          </p>
        </div>
```

with:

```liquid
        <div class="featured-text">
          <p class="featured-section">
            <a href="/sections/{{ story.section | downcase }}.html">{{ story.section }}</a>
          </p>
          <h2 class="featured-headline">
            <a href="{{ story.path }}.html">{{ story.headline }}</a>
          </h2>
          <p class="featured-subheadline">{{ story.subheadline }}</p>
          {% assign words = story.body | strip_html | split: ' ' | size %}
          {% assign reading_time = words | plus: 199 | divided_by: 200 %}
          {% if reading_time < 1 %}{% assign reading_time = 1 %}{% endif %}
          <p class="featured-meta">
            By {{ story.author }} &middot; {{ story.date }} &middot; {{ reading_time }} min read
          </p>
        </div>
```

- [ ] **Step 2: Link story card section tags and add reading time**

In `pages/index.liquid`, replace the story card content block (lines 45-51):

```liquid
          <p class="story-card-section">{{ story.section }}</p>
          <h3 class="story-card-headline">
            <a href="{{ story.path }}.html">{{ story.headline }}</a>
          </h3>
          <p class="story-card-subheadline">{{ story.subheadline }}</p>
          <p class="story-card-meta">
            By {{ story.author }} &middot; {{ story.date }}
          </p>
```

with:

```liquid
          <p class="story-card-section">
            <a href="/sections/{{ story.section | downcase }}.html">{{ story.section }}</a>
          </p>
          <h3 class="story-card-headline">
            <a href="{{ story.path }}.html">{{ story.headline }}</a>
          </h3>
          <p class="story-card-subheadline">{{ story.subheadline }}</p>
          {% assign words = story.body | strip_html | split: ' ' | size %}
          {% assign reading_time = words | plus: 199 | divided_by: 200 %}
          {% if reading_time < 1 %}{% assign reading_time = 1 %}{% endif %}
          <p class="story-card-meta">
            By {{ story.author }} &middot; {{ story.date }} &middot; {{ reading_time }} min read
          </p>
```

- [ ] **Step 3: Add section tag link hover CSS**

In `public/styles.css`, after the `.featured-section` rule (after line 209):

```css
.featured-section a,
.story-card-section a {
  color: inherit;
}

.featured-section a:hover,
.story-card-section a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 4: Commit**

```bash
git add pages/index.liquid public/styles.css
git commit -m "Add section tag links and reading time estimates to homepage"
```

---

### Task 6: Story Detail — Breadcrumb, Reading Time, Section Link, and "More From Section"

**Files:**
- Modify: `pages/story.liquid` (breadcrumb, meta updates, more-from block)
- Modify: `public/styles.css` (breadcrumb and more-from styles)

**Important:** This task requires verifying that the `stories` collection (all stories) is accessible on story detail pages for the "More from section" block. On story detail pages, `stories` refers to the current story object. A separate collection name or method may be needed to access all stories. If sibling stories are NOT accessible, implement everything except the "More from section" block and note it in the commit message.

- [ ] **Step 1: Add breadcrumb, section link, and reading time to story header**

Replace the entire contents of `pages/story.liquid` with:

```liquid
{% layout 'theme' title: stories.headline
  , page: 'story-detail'
  , active_section: stories.section %}

<article>
  <nav class="story-breadcrumb">
    <a class="breadcrumb-link" href="/">Home</a>
    <span class="breadcrumb-sep">/</span>
    {% if stories.section.size > 0 %}
      <a class="breadcrumb-link" href="/sections/{{ stories.section | downcase }}.html">{{ stories.section }}</a>
      <span class="breadcrumb-sep">/</span>
    {% endif %}
    <span class="breadcrumb-current">{{ stories.headline }}</span>
  </nav>

  <header class="story-header">
    {% if stories.section.size > 0 %}
      <p class="story-detail-section">
        <a href="/sections/{{ stories.section | downcase }}.html">{{ stories.section }}</a>
      </p>
    {% endif %}
    <h1 class="story-detail-headline">{{ stories.headline }}</h1>
    {% if stories.subheadline.size > 0 %}
      <p class="story-detail-subheadline">{{ stories.subheadline }}</p>
    {% endif %}
    {% assign words = stories.body | strip_html | split: ' ' | size %}
    {% assign reading_time = words | plus: 199 | divided_by: 200 %}
    {% if reading_time < 1 %}{% assign reading_time = 1 %}{% endif %}
    <p class="story-detail-meta">
      By <span class="story-detail-author">{{ stories.author }}</span> &middot; {{ stories.date }} &middot; {{ reading_time }} min read
    </p>
  </header>

  {% if stories.image %}
    <div class="story-hero-image">
      <img src="{{ stories.image.url }}" alt="{{ stories.image_caption }}">
    </div>
    {% if stories.image_caption.size > 0 %}
      <p class="story-image-caption">{{ stories.image_caption }}</p>
    {% endif %}
  {% elsif stories.cover_url != empty %}
    <div class="story-hero-image">
      <img src="{{ stories.cover_url }}" alt="{{ stories.image_caption }}">
    </div>
    {% if stories.image_caption.size > 0 %}
      <p class="story-image-caption">{{ stories.image_caption }}</p>
    {% endif %}
  {% endif %}

  <div class="story-body">
    {{ stories.body }}
  </div>
</article>
```

- [ ] **Step 2: Add breadcrumb CSS**

In `public/styles.css`, before the `.story-header` rule (before the `/* ---- Story Detail Page ---- */` comment):

```css
/* ---- Story Breadcrumb ---- */

.story-breadcrumb {
  max-width: var(--reading-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-xl) 0;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

Note: the `.breadcrumb-link`, `.breadcrumb-sep`, and `.breadcrumb-current` classes are already defined in the section page CSS from Task 3. They are reused here.

- [ ] **Step 3: Add section detail link hover CSS**

In `public/styles.css`, after the `.story-detail-section` rule:

```css
.story-detail-section a {
  color: inherit;
}

.story-detail-section a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 4: Verify sibling story access**

Build the template and check whether other story objects are accessible from within `pages/story.liquid`. Try adding this temporary debug block at the bottom of `pages/story.liquid` (before the closing `</article>` or after it):

```liquid
<!-- DEBUG: checking sibling access -->
{% for story in stories %}
  <!-- found: {{ story.headline }} -->
{% endfor %}
<!-- END DEBUG -->
```

Build and check the output HTML of any story page (e.g., `dist/stories/politics.html`). If the debug comments contain other story headlines, sibling access works. If the output is empty or only contains the current story's properties iterated as key-value pairs, sibling access is NOT available.

**If sibling access works:** Continue to Step 5.
**If sibling access does NOT work:** Remove the debug block, skip Steps 5-6, and commit what you have. Note in the commit message: "More-from-section block deferred — sibling story access not available on detail pages."

- [ ] **Step 5: Add "More from this section" block to story.liquid**

Append the following after the closing `</article>` tag in `pages/story.liquid`:

```liquid
{% assign related_count = 0 %}
{% for story in stories %}
  {% if story.section == stories.section and story.slug != stories.slug %}
    {% assign related_count = related_count | plus: 1 %}
  {% endif %}
{% endfor %}

{% if related_count >= 2 %}
  <div class="more-from-section">
    <div class="section-divider">
      <div class="section-divider-inner">
        <div class="section-divider-line"></div>
        <span class="section-divider-label">More from {{ stories.section }}</span>
        <div class="section-divider-line"></div>
      </div>
    </div>

    <div class="more-from-grid">
      {% assign shown = 0 %}
      {% for story in stories %}
        {% if story.section == stories.section and story.slug != stories.slug %}
          {% if shown < 3 %}
            <article class="more-from-card">
              <a href="/{{ story.path }}.html">
                {% if story.image %}
                  <img class="more-from-image" src="{{ story.image.url }}" alt="{{ story.image_caption }}">
                {% elsif story.cover_url != empty %}
                  <img class="more-from-image" src="{{ story.cover_url }}" alt="{{ story.image_caption }}">
                {% else %}
                  <div class="more-from-image-placeholder"></div>
                {% endif %}
              </a>
              <h3 class="more-from-headline">
                <a href="/{{ story.path }}.html">{{ story.headline }}</a>
              </h3>
              {% assign words = story.body | strip_html | split: ' ' | size %}
              {% assign reading_time = words | plus: 199 | divided_by: 200 %}
              {% if reading_time < 1 %}{% assign reading_time = 1 %}{% endif %}
              <p class="more-from-meta">
                By {{ story.author }} &middot; {{ reading_time }} min read
              </p>
            </article>
            {% assign shown = shown | plus: 1 %}
          {% endif %}
        {% endif %}
      {% endfor %}
    </div>

    <div class="more-from-link-wrap">
      <a class="more-from-link" href="/sections/{{ stories.section | downcase }}.html">All {{ stories.section }} Stories &rarr;</a>
    </div>
  </div>
{% endif %}
```

**Note:** This block uses `stories.section` and `stories.slug` to reference the current story's fields, and `story.section` / `story.slug` for the loop variable. This distinction is critical — `stories` is the current page object, `story` is the loop iterator.

- [ ] **Step 6: Add "More from section" CSS**

In `public/styles.css`, after the `.story-body hr` rule:

```css
/* ---- More From Section ---- */

.more-from-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--space-xl) var(--space-3xl);
}

.more-from-section .section-divider {
  padding: var(--space-xl) 0 var(--space-lg);
}

.more-from-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
  margin-bottom: var(--space-lg);
}

.more-from-card {
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--color-rule-light);
}

.more-from-image {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  margin-bottom: var(--space-sm);
  transition: opacity 0.2s ease;
}

.more-from-card a:hover .more-from-image {
  opacity: 0.9;
}

.more-from-image-placeholder {
  width: 100%;
  aspect-ratio: 3 / 2;
  background: var(--color-bg-warm);
  margin-bottom: var(--space-sm);
}

.more-from-headline {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: var(--space-xs);
}

.more-from-headline a:hover {
  color: var(--color-accent);
}

.more-from-meta {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.more-from-link-wrap {
  text-align: center;
}

.more-from-link {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-accent);
}

.more-from-link:hover {
  text-decoration: underline;
}
```

- [ ] **Step 7: Add responsive CSS for breadcrumb and more-from**

In `public/styles.css`, inside the `@media (max-width: 900px)` block, add:

```css
  .more-from-grid {
    grid-template-columns: repeat(2, 1fr);
  }
```

Inside the `@media (max-width: 600px)` block, add:

```css
  .more-from-grid {
    grid-template-columns: 1fr;
  }

  .story-breadcrumb {
    padding: var(--space-md) var(--space-md) 0;
  }

  .more-from-section {
    padding: 0 var(--space-md) var(--space-2xl);
  }
```

- [ ] **Step 8: Remove debug block and commit**

Remove the debug block from Step 4 if it's still present. Then:

```bash
git add pages/story.liquid public/styles.css
git commit -m "Add breadcrumb, reading time, section links, and more-from-section to story detail"
```

---

## Summary of Files Changed

| File | Tasks | Changes |
|------|-------|---------|
| `objects.toml` | 1 | Add `template = "section"` |
| `objects/sections/*.toml` | 1 | Rename from numeric to slug-based filenames |
| `pages/section.liquid` | 1, 3 | New file — section page template |
| `pages/index.liquid` | 2, 5 | Clickable images, section tag links, reading time |
| `pages/story.liquid` | 6 | Breadcrumb, reading time, section link, more-from block |
| `layout/theme.liquid` | 4 | Nav links to section pages, active state |
| `public/styles.css` | 2, 3, 4, 5, 6 | All new styles |

## Verification Checklist

After all tasks are complete, verify:
- [ ] Homepage: all images are clickable, section tags link to section pages, reading times shown
- [ ] Nav: links go to `/sections/{slug}.html`, not `/#slug`
- [ ] Section pages: lead story + grid, breadcrumb, correct story filtering, reading times
- [ ] Section page nav: all 4 sections shown, current section highlighted
- [ ] Story detail: breadcrumb with Home / Section / Title, reading time in meta, section tag links
- [ ] Story detail: "More from section" block shows 2-3 related stories (if sibling access works)
- [ ] Dark mode: all new elements respect the theme toggle
- [ ] Responsive: check all pages at 900px and 600px breakpoints
