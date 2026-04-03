# Bar/Restaurant Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality dark-themed bar/restaurant Archival template with warm gold accents, Cormorant Garamond + Outfit typography, centered menu layout with dotted leaders.

**Architecture:** This is a static site template using Archival's object system. Content is defined in `.toml` files (schema in `objects.toml`, instances in `objects/`). Pages are Liquid templates that read objects and render HTML. A single CSS file handles all styling. The template branches from `templates/new` which provides the minimal scaffold.

**Tech Stack:** Archival static site generator, Liquid templating, CSS (custom properties, Grid, Flexbox), Google Fonts (Cormorant Garamond, Outfit)

**Key Archival Conventions:**
- Markdown fields in object `.toml` files are plain multiline strings: `description = """..."""` — NOT TOML tables
- In template pages rendered per-collection-item, access the current object via the **collection name** from `objects.toml`, not the template file name
- The `order` field is a reserved integer controlling sort order (ascending)
- Image fields have a `.url` property for the CDN URL; always check `{% if obj.image.url %}` before rendering `<img>`
- Partials are prefixed with `_` and included via `{% include 'partial-name' var: value %}`
- Layouts are invoked via `{% layout 'theme' title: "Page Title", page: "page-id" %}`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `manifest.toml` | Modify | Set archival_version |
| `archival_template.toml` | Modify | Template metadata (name, description, tags) |
| `archival_editor.toml` | Modify | Editor view config for menu_item and event |
| `objects.toml` | Modify | Schema: site, menu_item, event |
| `objects/site.toml` | Create | Singleton venue data |
| `objects/menu_item/*.toml` (10 files) | Create | Individual menu items |
| `objects/event/*.toml` (3 files) | Create | Individual events |
| `style/theme.css` | Create | All CSS — tokens, reset, components, responsive, print |
| `layout/theme.liquid` | Modify | HTML shell with meta, fonts, accent color, header/footer includes |
| `pages/_header.liquid` | Create | Site navigation partial |
| `pages/_footer.liquid` | Create | Footer partial |
| `pages/_menu-section.liquid` | Create | Menu category section partial |
| `pages/_event-card.liquid` | Create | Event card partial |
| `pages/index.liquid` | Modify | Homepage (hero, featured, about, hours, events, instagram) |
| `pages/menu.liquid` | Create | Menu page with sticky nav and dotted-leader items |
| `pages/404.liquid` | Modify | Styled 404 page |
| `README.md` | Create | User-facing template documentation |

---

### Task 1: Branch Setup

**Files:** None (git operations only)

- [ ] **Step 1: Create the template branch from templates/new**

```bash
git checkout templates/new
git checkout -b templates/bar-restaurant-1
```

- [ ] **Step 2: Verify clean starting state**

```bash
git log --oneline -3
```

Expected: You should see the `templates/new` commit(s). The working tree should be clean.

- [ ] **Step 3: Commit** — No commit needed, branch creation only.

---

### Task 2: Configuration Files (manifest, template metadata, editor config)

**Files:**
- Modify: `manifest.toml`
- Modify: `archival_template.toml`
- Modify: `archival_editor.toml`

- [ ] **Step 1: Write manifest.toml**

Replace the empty `manifest.toml` with:

```toml
archival_version = "0.5.0"
```

- [ ] **Step 2: Write archival_template.toml**

Replace the entire file with:

```toml
#:schema https://raw.githubusercontent.com/jesseditson/archival/refs/heads/toml_schemas/archival_template.schema.json
name = "Bar & Restaurant"
description = "A dark, sophisticated template for bars and restaurants. Features a centered menu with dotted-leader pricing, events section, and warm gold accent theming."
context = "This template is designed for upscale bars, cocktail lounges, and contemporary restaurants. It features a dark color scheme with customizable accent color, a dedicated menu page with category navigation, event listings, and all the essential info a venue needs."
tags = ["restaurant", "bar", "food", "cocktails", "menu"]
tlds = ["com", "bar", "restaurant", "menu"]
keep_objects = []
```

- [ ] **Step 3: Write archival_editor.toml**

Replace the entire file with:

```toml
# Configure how objects appear in the Archival editor.

[[menu_item.views]]
name = "default"
primary = "name"
secondary = "category"

[[event.views]]
name = "default"
primary = "title"
secondary = "date"
```

- [ ] **Step 4: Commit**

```bash
git add manifest.toml archival_template.toml archival_editor.toml
git commit -m "Configure manifest, template metadata, and editor views"
```

---

### Task 3: Object Schema (objects.toml)

**Files:**
- Modify: `objects.toml`

- [ ] **Step 1: Write objects.toml**

Replace the entire file with:

```toml
# Object definitions for the Bar & Restaurant template.

[site]
name = "string"
tagline = "string"
description = "markdown"
hero_image = "image"
logo = "image"
address = "string"
phone = "string"
email = "string"
instagram = "string"
hours = "markdown"
reservation_url = "string"
accent_color = "string"

[menu_item]
name = "string"
description = "string"
price = "string"
category = "string"
featured = "boolean"
image = "image"

[event]
title = "string"
date = "date"
description = "markdown"
image = "image"
link = "string"
```

- [ ] **Step 2: Commit**

```bash
git add objects.toml
git commit -m "Define site, menu_item, and event object schemas"
```

---

### Task 4: Site Object Content

**Files:**
- Create: `objects/site.toml`

- [ ] **Step 1: Write objects/site.toml**

```toml
order = -1
name = "The Gilded Hour"
tagline = "Cocktails & Kitchen"
description = """An intimate evening awaits at The Gilded Hour, where craft cocktails meet bold, seasonal cuisine. Nestled in the heart of Los Angeles, we bring together inventive drinks and a kitchen that doesn't play it safe — all in a space designed to make you lose track of time."""
address = "742 N La Brea Ave, Los Angeles, CA 90038"
phone = "(323) 555-0178"
email = "hello@thegildedhour.com"
instagram = "thegildedhour"
hours = """**Tuesday – Thursday** 5:00 PM – 12:00 AM

**Friday – Saturday** 5:00 PM – 2:00 AM

**Sunday** 4:00 PM – 11:00 PM

**Monday** Closed"""
reservation_url = "https://resy.com"
accent_color = "#c9a96e"
```

- [ ] **Step 2: Commit**

```bash
git add objects/site.toml
git commit -m "Add site object with venue content"
```

---

### Task 5: Menu Item Objects

**Files:**
- Create: `objects/menu_item/smoked-old-fashioned.toml`
- Create: `objects/menu_item/lavender-collins.toml`
- Create: `objects/menu_item/midnight-in-oaxaca.toml`
- Create: `objects/menu_item/charred-shishito-peppers.toml`
- Create: `objects/menu_item/tuna-tartare.toml`
- Create: `objects/menu_item/burrata-stone-fruit.toml`
- Create: `objects/menu_item/wagyu-burger.toml`
- Create: `objects/menu_item/pan-seared-branzino.toml`
- Create: `objects/menu_item/mushroom-risotto.toml`
- Create: `objects/menu_item/dark-chocolate-fondant.toml`

- [ ] **Step 1: Create objects/menu_item/ directory**

```bash
mkdir -p objects/menu_item
```

- [ ] **Step 2: Write all 10 menu item files**

**objects/menu_item/smoked-old-fashioned.toml:**
```toml
order = 1
name = "Smoked Old Fashioned"
description = "Bourbon, demerara, aromatic bitters, finished with a wisp of applewood smoke."
price = "18"
category = "Cocktails"
featured = true
```

**objects/menu_item/lavender-collins.toml:**
```toml
order = 2
name = "Lavender Collins"
description = "Gin, house lavender syrup, fresh lemon, sparkling water. Light, floral, dangerously easy to drink."
price = "16"
category = "Cocktails"
featured = false
```

**objects/menu_item/midnight-in-oaxaca.toml:**
```toml
order = 3
name = "Midnight in Oaxaca"
description = "Mezcal, activated charcoal, agave nectar, lime, chili salt rim. Dark, smoky, unforgettable."
price = "20"
category = "Cocktails"
featured = false
```

**objects/menu_item/charred-shishito-peppers.toml:**
```toml
order = 1
name = "Charred Shishito Peppers"
description = "Blistered and tossed with smoked sea salt, bonito flakes, and a squeeze of yuzu."
price = "12"
category = "Small Plates"
featured = false
```

**objects/menu_item/tuna-tartare.toml:**
```toml
order = 2
name = "Tuna Tartare"
description = "Sushi-grade ahi, avocado mousse, crispy wontons, togarashi, ponzu."
price = "19"
category = "Small Plates"
featured = true
```

**objects/menu_item/burrata-stone-fruit.toml:**
```toml
order = 3
name = "Burrata & Stone Fruit"
description = "Creamy burrata, grilled peaches, prosciutto, aged balsamic, micro basil."
price = "17"
category = "Small Plates"
featured = false
```

**objects/menu_item/wagyu-burger.toml:**
```toml
order = 1
name = "Wagyu Burger"
description = "Double-smashed wagyu patties, aged gruyère, caramelized onion, black truffle aioli, brioche."
price = "28"
category = "Entrees"
featured = true
```

**objects/menu_item/pan-seared-branzino.toml:**
```toml
order = 2
name = "Pan-Seared Branzino"
description = "Mediterranean sea bass, roasted fennel, castelvetrano olives, caper-lemon butter."
price = "36"
category = "Entrees"
featured = false
```

**objects/menu_item/mushroom-risotto.toml:**
```toml
order = 3
name = "Mushroom Risotto"
description = "Arborio rice, wild mushroom medley, truffle oil, aged parmesan, fresh thyme."
price = "24"
category = "Entrees"
featured = false
```

**objects/menu_item/dark-chocolate-fondant.toml:**
```toml
order = 1
name = "Dark Chocolate Fondant"
description = "Warm-centered 72% cacao fondant, salted caramel, crème fraîche, gold leaf."
price = "14"
category = "Desserts"
featured = false
```

- [ ] **Step 3: Commit**

```bash
git add objects/menu_item/
git commit -m "Add 10 menu item objects across 4 categories"
```

---

### Task 6: Event Objects

**Files:**
- Create: `objects/event/live-jazz-friday.toml`
- Create: `objects/event/winemakers-dinner.toml`
- Create: `objects/event/golden-hour-happy-hour.toml`

- [ ] **Step 1: Create objects/event/ directory**

```bash
mkdir -p objects/event
```

- [ ] **Step 2: Write all 3 event files**

**objects/event/live-jazz-friday.toml:**
```toml
order = 1
title = "Live Jazz Friday"
date = 2026-04-11
description = """Join us every Friday evening for live jazz from some of LA's finest musicians. This week featuring the **Marcus Cole Quartet** — smooth, soulful, and the perfect backdrop to a well-made cocktail."""
link = ""
```

**objects/event/winemakers-dinner.toml:**
```toml
order = 2
title = "Winemaker's Dinner"
date = 2026-04-19
description = """A five-course pairing dinner featuring wines from **Domaine de la Côte**, Santa Rita Hills. Our chef has crafted a menu that highlights each pour. Limited to 30 guests."""
link = "https://resy.com"
```

**objects/event/golden-hour-happy-hour.toml:**
```toml
order = 3
title = "Golden Hour"
date = 2026-04-08
description = """Every Tuesday through Thursday, 5–7 PM. Half-price select cocktails and $10 small plates. The best way to start your evening."""
link = ""
```

- [ ] **Step 3: Commit**

```bash
git add objects/event/
git commit -m "Add 3 event objects"
```

---

### Task 7: CSS Theme (style/theme.css)

**Files:**
- Create: `style/theme.css`

This is the largest single file. It contains all styling for the template.

- [ ] **Step 1: Create the style directory**

```bash
mkdir -p style
```

- [ ] **Step 2: Write style/theme.css**

```css
/* ============================================
   Bar & Restaurant Template — Theme CSS
   ============================================ */

/* ----- 1. Custom Properties ----- */

:root {
  /* Accent — overridden by site object in theme.liquid */
  --accent: #c9a96e;

  /* Backgrounds */
  --bg-primary: #0a0a0a;
  --bg-surface: #141414;
  --bg-surface-hover: #1a1a1a;

  /* Text */
  --text-primary: #f5f0e8;
  --text-secondary: #9a9088;
  --text-muted: #555;

  /* Borders */
  --border: #1a1a1a;
  --border-dotted: #333;

  /* Typography */
  --font-heading: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Outfit', system-ui, sans-serif;

  /* Spacing */
  --section-gap: 6rem;
  --container-width: 1100px;
  --container-padding: 1.5rem;
}

/* ----- 2. Reset / Base ----- */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-body);
  font-weight: 300;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-secondary);
  background-color: var(--bg-primary);
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: var(--accent);
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: var(--text-primary);
}

/* ----- 3. Typography ----- */

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  color: var(--text-primary);
  font-weight: 600;
  line-height: 1.15;
}

h1 {
  font-size: clamp(2.5rem, 6vw, 5rem);
}

h2 {
  font-size: clamp(1.8rem, 4vw, 3rem);
  color: var(--accent);
}

h3 {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
}

.label {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
}

/* ----- 4. Layout Utilities ----- */

.container {
  max-width: var(--container-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

.section {
  padding: var(--section-gap) 0;
}

.section-narrow {
  max-width: 680px;
  margin: 0 auto;
}

.text-center {
  text-align: center;
}

/* ----- 5. Skip Link ----- */

.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  background: var(--accent);
  color: var(--bg-primary);
  padding: 0.5rem 1rem;
  z-index: 1000;
  font-size: 0.875rem;
  font-weight: 500;
}

.skip-link:focus {
  top: 1rem;
  color: var(--bg-primary);
}

/* ----- 6. Header ----- */

.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 1.25rem 0;
  background-color: transparent;
  transition: background-color 0.4s ease;
}

.site-header-scrolled,
.site-header:not(.site-header-transparent) {
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border);
}

.site-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-logo {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.site-logo:hover {
  color: var(--accent);
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.site-nav a {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.3s ease;
}

.site-nav a:hover,
.site-nav a.active {
  color: var(--text-primary);
}

.btn {
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 0.75rem 1.75rem;
  border: 1px solid var(--accent);
  color: var(--accent);
  text-decoration: none;
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
  background: transparent;
}

.btn:hover {
  background-color: var(--accent);
  color: var(--bg-primary);
}

.btn-filled {
  background-color: var(--accent);
  color: var(--bg-primary);
}

.btn-filled:hover {
  background-color: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--bg-primary);
}

/* Mobile nav toggle */
.nav-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.nav-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background-color: var(--text-primary);
  margin: 5px 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Mobile nav checkbox hack */
.nav-toggle-checkbox {
  display: none;
}

@media (max-width: 768px) {
  .nav-toggle {
    display: block;
    z-index: 110;
  }

  .site-nav {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    flex-direction: column;
    justify-content: center;
    gap: 2rem;
    background-color: var(--bg-primary);
    border-left: 1px solid var(--border);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 105;
  }

  .site-nav a {
    font-size: 0.9rem;
  }

  .nav-toggle-checkbox:checked ~ .site-nav {
    transform: translateX(0);
  }

  .nav-toggle-checkbox:checked ~ .nav-toggle span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }

  .nav-toggle-checkbox:checked ~ .nav-toggle span:nth-child(2) {
    opacity: 0;
  }

  .nav-toggle-checkbox:checked ~ .nav-toggle span:nth-child(3) {
    transform: rotate(-45deg) translate(5px, -5px);
  }

  .nav-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 102;
  }

  .nav-toggle-checkbox:checked ~ .nav-overlay {
    display: block;
  }
}

/* ----- 7. Hero ----- */

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  /* Offset for the sticky header overlap */
  margin-top: -72px;
  padding-top: 72px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 10, 0.4) 0%,
    rgba(10, 10, 10, 0.7) 60%,
    rgba(10, 10, 10, 1) 100%
  );
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 700px;
  padding: 2rem var(--container-padding);
}

.hero-tagline {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
}

.hero h1 {
  margin-bottom: 1.5rem;
}

.hero-ctas {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
}

/* ----- 8. Featured Items ----- */

.featured {
  text-align: center;
}

.featured h2 {
  margin-bottom: 1rem;
}

.featured .label {
  margin-bottom: 0.75rem;
  display: block;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2.5rem;
  margin-top: 3rem;
  text-align: center;
}

.featured-item {
  padding: 2rem 1.5rem;
}

.featured-item-image {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.featured-item h3 {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
}

.featured-item p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.featured-item .price {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--accent);
  letter-spacing: 0.1em;
}

/* ----- 9. About Section ----- */

.about {
  text-align: center;
}

.about-body {
  max-width: 640px;
  margin: 1.5rem auto 0;
  font-size: 1.05rem;
  line-height: 1.8;
}

.about-body p {
  margin-bottom: 1rem;
}

/* Horizontal rule divider */
.divider {
  width: 60px;
  border: none;
  border-top: 1px solid var(--accent);
  margin: 3rem auto;
}

/* ----- 10. Hours & Location ----- */

.info {
  text-align: center;
}

.info h2 {
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  max-width: 700px;
  margin: 0 auto;
  text-align: left;
}

@media (max-width: 600px) {
  .info-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.info-block h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--accent);
}

.info-block p,
.info-block a {
  font-size: 0.95rem;
  line-height: 1.8;
}

.info-block a {
  color: var(--text-secondary);
}

.info-block a:hover {
  color: var(--accent);
}

.hours-block p {
  margin-bottom: 0.25rem;
}

/* ----- 11. Events ----- */

.events {
  text-align: center;
}

.events h2 {
  margin-bottom: 2.5rem;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  text-align: left;
}

.event-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border);
  padding: 2rem;
  transition: border-color 0.3s ease, transform 0.2s ease;
}

.event-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.event-card-image {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  margin-bottom: 1.25rem;
  opacity: 0.9;
}

.event-card .label {
  margin-bottom: 0.75rem;
  display: block;
}

.event-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
}

.event-card p {
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.event-card-link {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
}

.event-card-link:hover {
  color: var(--text-primary);
}

/* ----- 12. Instagram CTA ----- */

.instagram-cta {
  text-align: center;
  padding: var(--section-gap) 0;
}

.instagram-cta .label {
  display: block;
  margin-bottom: 1rem;
}

.instagram-cta a {
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.instagram-cta a:hover {
  color: var(--accent);
}

/* ----- 13. Footer ----- */

.site-footer {
  border-top: 1px solid var(--border);
  padding: 3rem 0 2rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-col h4 {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.footer-col p,
.footer-col a {
  font-size: 0.85rem;
  line-height: 1.8;
  color: var(--text-muted);
}

.footer-col a:hover {
  color: var(--accent);
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.footer-bottom a {
  color: var(--text-muted);
}

.footer-bottom a:hover {
  color: var(--accent);
}

/* ----- 14. Menu Page — Category Nav ----- */

.menu-nav {
  position: sticky;
  top: 62px; /* Below site header */
  z-index: 50;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  text-align: center;
}

.menu-nav-list {
  list-style: none;
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.menu-nav-list a {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.3s ease;
}

.menu-nav-list a:hover {
  color: var(--accent);
}

/* ----- 15. Menu Page — Sections & Items ----- */

.menu-section {
  padding: 3.5rem 0;
}

.menu-section h2 {
  text-align: center;
  margin-bottom: 2.5rem;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
}

.menu-items {
  max-width: 600px;
  margin: 0 auto;
}

.menu-item {
  margin-bottom: 1.75rem;
  transition: opacity 0.3s ease;
}

.menu-item:hover {
  opacity: 0.85;
}

.menu-item-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.menu-item-name {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.menu-item-dots {
  flex: 1;
  border-bottom: 1px dotted var(--border-dotted);
  margin-bottom: 0.25rem;
}

.menu-item-price {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 400;
  color: var(--accent);
  white-space: nowrap;
}

.menu-item-description {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
  line-height: 1.5;
}

.menu-item-image {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  margin-bottom: 1rem;
  opacity: 0.9;
}

/* ----- 16. 404 Page ----- */

.page-404 {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem var(--container-padding);
}

.page-404 h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  margin-bottom: 1rem;
}

.page-404 p {
  margin-bottom: 2rem;
  font-size: 1.05rem;
}

/* ----- 17. Animations ----- */

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease forwards;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}

@supports not (animation-timeline: view()) {
  .fade-in {
    opacity: 1;
    transform: none;
    animation: none;
  }
}

/* ----- 18. Print Styles ----- */

@media print {
  .site-header,
  .site-footer,
  .hero,
  .menu-nav,
  .events,
  .instagram-cta,
  .skip-link {
    display: none !important;
  }

  body {
    background: #fff;
    color: #111;
    font-size: 11pt;
  }

  h1, h2, h3, h4 {
    color: #111;
  }

  .menu-section {
    padding: 1.5rem 0;
    break-inside: avoid;
  }

  .menu-section h2 {
    color: #333;
  }

  .menu-item-name {
    color: #111;
  }

  .menu-item-price {
    color: #333;
  }

  .menu-item-dots {
    border-bottom-color: #ccc;
  }

  .menu-item-description {
    color: #555;
  }

  a {
    color: #111;
    text-decoration: none;
  }
}

/* ----- 19. Focus Styles ----- */

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

a:focus:not(:focus-visible) {
  outline: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add style/theme.css
git commit -m "Add complete theme CSS with dark palette, typography, and responsive layout"
```

---

### Task 8: Layout Template (layout/theme.liquid)

**Files:**
- Modify: `layout/theme.liquid`

- [ ] **Step 1: Replace layout/theme.liquid**

Replace the entire file with:

```liquid
<!doctype html>
<html lang="en">

  <head>
    <meta charset="utf-8">
    <title>{% if title %}{{ title }} — {{ objects.site.name }}{% else %}{{ objects.site.name }}{% endif %}</title>
    <meta name="description" content="{{ objects.site.description | strip_html | strip_newlines | truncate: 160 }}">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Open Graph -->
    <meta property="og:title" content="{{ objects.site.name }}">
    <meta property="og:description" content="{{ objects.site.description | strip_html | strip_newlines | truncate: 160 }}">
    <meta property="og:type" content="website">
    {% if objects.site.hero_image.url %}
    <meta property="og:image" content="{{ objects.site.hero_image.url }}">
    {% endif %}

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">

    <!-- Theme CSS -->
    <link rel="stylesheet" href="/style/theme.css">

    <!-- Dynamic accent color -->
    {% if objects.site.accent_color %}
    <style>
      :root {
        --accent: {{ objects.site.accent_color }};
      }
    </style>
    {% endif %}
  </head>

  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>

    {% include 'header' page: page %}

    <main id="main-content">
      {{ page_content }}
    </main>

    {% include 'footer' %}
  </body>

</html>
```

- [ ] **Step 2: Commit**

```bash
git add layout/theme.liquid
git commit -m "Build theme layout with meta tags, fonts, accent color, and includes"
```

---

### Task 9: Header Partial (pages/_header.liquid)

**Files:**
- Create: `pages/_header.liquid`

- [ ] **Step 1: Write pages/_header.liquid**

```liquid
<header class="site-header{% if page == 'home' %} site-header-transparent{% endif %}">
  <div class="container">
    {% if objects.site.logo.url %}
      <a href="/" class="site-logo" aria-label="{{ objects.site.name }} — Home">
        <img src="{{ objects.site.logo.url }}" alt="{{ objects.site.name }}" style="height: 40px; width: auto;">
      </a>
    {% else %}
      <a href="/" class="site-logo">{{ objects.site.name }}</a>
    {% endif %}

    <input type="checkbox" id="nav-toggle" class="nav-toggle-checkbox" aria-hidden="true">
    <label for="nav-toggle" class="nav-toggle" aria-label="Toggle navigation">
      <span></span>
      <span></span>
      <span></span>
    </label>

    <label for="nav-toggle" class="nav-overlay" aria-hidden="true"></label>

    <nav class="site-nav" aria-label="Main navigation">
      <a href="/"{% if page == 'home' %} class="active"{% endif %}>Home</a>
      <a href="/menu"{% if page == 'menu' %} class="active"{% endif %}>Menu</a>
      {% if objects.site.reservation_url %}
        <a href="{{ objects.site.reservation_url }}" class="btn" target="_blank" rel="noopener noreferrer">Reserve</a>
      {% endif %}
    </nav>
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add pages/_header.liquid
git commit -m "Add header partial with logo, nav, mobile menu, and reserve CTA"
```

---

### Task 10: Footer Partial (pages/_footer.liquid)

**Files:**
- Create: `pages/_footer.liquid`

- [ ] **Step 1: Write pages/_footer.liquid**

```liquid
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <h4>Visit</h4>
        <p>{{ objects.site.address }}</p>
        {% if objects.site.phone %}
          <p><a href="tel:{{ objects.site.phone | remove: '(' | remove: ')' | remove: ' ' | remove: '-' }}">{{ objects.site.phone }}</a></p>
        {% endif %}
        {% if objects.site.email %}
          <p><a href="mailto:{{ objects.site.email }}">{{ objects.site.email }}</a></p>
        {% endif %}
      </div>

      <div class="footer-col">
        <h4>Hours</h4>
        <div class="hours-block">
          {{ objects.site.hours }}
        </div>
      </div>

      <div class="footer-col">
        <h4>Connect</h4>
        {% if objects.site.instagram %}
          <p><a href="https://instagram.com/{{ objects.site.instagram }}" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram">Instagram</a></p>
        {% endif %}
        {% if objects.site.reservation_url %}
          <p><a href="{{ objects.site.reservation_url }}" target="_blank" rel="noopener noreferrer">Reservations</a></p>
        {% endif %}
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; {{ "now" | date: "%Y" }} {{ objects.site.name }}. Powered by <a href="https://archival.dev" target="_blank" rel="noopener noreferrer">Archival</a>.</p>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add pages/_footer.liquid
git commit -m "Add footer partial with address, hours, and social links"
```

---

### Task 11: Menu Section Partial (pages/_menu-section.liquid)

**Files:**
- Create: `pages/_menu-section.liquid`

- [ ] **Step 1: Write pages/_menu-section.liquid**

```liquid
{% if items.size > 0 %}
<section class="menu-section fade-in" id="{{ category_name | downcase | replace: ' ', '-' }}">
  <h2>{{ category_name }}</h2>
  <div class="menu-items">
    {% for item in items %}
      <div class="menu-item">
        {% if item.image.url %}
          <img class="menu-item-image" src="{{ item.image.url }}" alt="{{ item.name }}">
        {% endif %}
        <div class="menu-item-header">
          <span class="menu-item-name">{{ item.name }}</span>
          <span class="menu-item-dots"></span>
          <span class="menu-item-price">{{ item.price }}</span>
        </div>
        {% if item.description %}
          <p class="menu-item-description">{{ item.description }}</p>
        {% endif %}
      </div>
    {% endfor %}
  </div>
</section>
{% endif %}
```

- [ ] **Step 2: Commit**

```bash
git add pages/_menu-section.liquid
git commit -m "Add menu section partial with dotted-leader item layout"
```

---

### Task 12: Event Card Partial (pages/_event-card.liquid)

**Files:**
- Create: `pages/_event-card.liquid`

- [ ] **Step 1: Write pages/_event-card.liquid**

```liquid
<article class="event-card">
  {% if event_image %}
    <img class="event-card-image" src="{{ event_image }}" alt="{{ event_title }}">
  {% endif %}
  <span class="label">{{ event_date | date: "%B %d, %Y" }}</span>
  <h3>{{ event_title }}</h3>
  <div>{{ event_description }}</div>
  {% if event_link != "" %}
    <a href="{{ event_link }}" class="event-card-link" target="_blank" rel="noopener noreferrer">Learn More &rarr;</a>
  {% endif %}
</article>
```

- [ ] **Step 2: Commit**

```bash
git add pages/_event-card.liquid
git commit -m "Add event card partial"
```

---

### Task 13: Homepage (pages/index.liquid)

**Files:**
- Modify: `pages/index.liquid`

- [ ] **Step 1: Replace pages/index.liquid**

Replace the entire file with:

```liquid
{% layout 'theme' page: 'home' %}

<!-- Hero -->
<section class="hero">
  {% if objects.site.hero_image.url %}
    <div class="hero-bg" style="background-image: url('{{ objects.site.hero_image.url }}');"></div>
  {% endif %}
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <p class="hero-tagline">{{ objects.site.tagline }}</p>
    <h1>{{ objects.site.name }}</h1>
    <div class="hero-ctas">
      <a href="/menu" class="btn">View Menu</a>
      {% if objects.site.reservation_url %}
        <a href="{{ objects.site.reservation_url }}" class="btn btn-filled" target="_blank" rel="noopener noreferrer">Reserve a Table</a>
      {% endif %}
    </div>
  </div>
</section>

<!-- Featured Items -->
{% assign featured = objects.menu_item | where: "featured", true %}
{% if featured.size > 0 %}
<section class="section featured fade-in">
  <div class="container">
    <span class="label">From Our Kitchen &amp; Bar</span>
    <h2>The Signatures</h2>
    <div class="featured-grid">
      {% for item in featured %}
        <div class="featured-item">
          {% if item.image.url %}
            <img class="featured-item-image" src="{{ item.image.url }}" alt="{{ item.name }}">
          {% endif %}
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>
          <span class="price">{{ item.price }}</span>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
{% endif %}

<hr class="divider">

<!-- About / Vibe -->
<section class="section about fade-in">
  <div class="container">
    <span class="label">Our Story</span>
    <h2>The Vibe</h2>
    <div class="about-body">
      {{ objects.site.description }}
    </div>
  </div>
</section>

<hr class="divider">

<!-- Hours & Location -->
<section class="section info fade-in">
  <div class="container">
    <span class="label">Find Us</span>
    <h2>Hours &amp; Location</h2>
    <div class="info-grid">
      <div class="info-block">
        <h3>Location</h3>
        <p>{{ objects.site.address }}</p>
        {% if objects.site.address %}
          <p style="margin-top: 0.75rem;">
            <a href="https://www.google.com/maps/search/?api=1&query={{ objects.site.address | url_encode }}" target="_blank" rel="noopener noreferrer" class="btn" style="margin-top: 0.5rem;">Get Directions</a>
          </p>
        {% endif %}
        {% if objects.site.phone %}
          <p style="margin-top: 1rem;"><a href="tel:{{ objects.site.phone | remove: '(' | remove: ')' | remove: ' ' | remove: '-' }}">{{ objects.site.phone }}</a></p>
        {% endif %}
        {% if objects.site.email %}
          <p><a href="mailto:{{ objects.site.email }}">{{ objects.site.email }}</a></p>
        {% endif %}
      </div>
      <div class="info-block hours-block">
        <h3>Hours</h3>
        {{ objects.site.hours }}
      </div>
    </div>
  </div>
</section>

<!-- Events -->
{% if objects.event.size > 0 %}
<hr class="divider">
<section class="section events fade-in">
  <div class="container">
    <span class="label">What's Happening</span>
    <h2>Upcoming Events</h2>
    <div class="events-grid">
      {% for event in objects.event %}
        {% include 'event-card'
          event_title: event.title,
          event_date: event.date,
          event_description: event.description,
          event_image: event.image.url,
          event_link: event.link
        %}
      {% endfor %}
    </div>
  </div>
</section>
{% endif %}

<!-- Instagram CTA -->
{% if objects.site.instagram %}
<hr class="divider">
<section class="instagram-cta fade-in">
  <span class="label">Follow Along</span>
  <a href="https://instagram.com/{{ objects.site.instagram }}" target="_blank" rel="noopener noreferrer">@{{ objects.site.instagram }}</a>
</section>
{% endif %}
```

- [ ] **Step 2: Commit**

```bash
git add pages/index.liquid
git commit -m "Build homepage with hero, featured items, about, hours, events, and instagram"
```

---

### Task 14: Menu Page (pages/menu.liquid)

**Files:**
- Create: `pages/menu.liquid`

- [ ] **Step 1: Write pages/menu.liquid**

```liquid
{% layout 'theme' title: 'Menu', page: 'menu' %}

<!-- Category Navigation -->
<nav class="menu-nav" aria-label="Menu categories">
  <ul class="menu-nav-list">
    <li><a href="#cocktails">Cocktails</a></li>
    <li><a href="#small-plates">Small Plates</a></li>
    <li><a href="#entrees">Entrees</a></li>
    <li><a href="#desserts">Desserts</a></li>
  </ul>
</nav>

<div class="container" style="padding-top: 1rem; padding-bottom: 4rem;">

  {% assign cocktails = objects.menu_item | where: "category", "Cocktails" %}
  {% include 'menu-section' category_name: "Cocktails", items: cocktails %}

  {% assign small_plates = objects.menu_item | where: "category", "Small Plates" %}
  {% include 'menu-section' category_name: "Small Plates", items: small_plates %}

  {% assign entrees = objects.menu_item | where: "category", "Entrees" %}
  {% include 'menu-section' category_name: "Entrees", items: entrees %}

  {% assign desserts = objects.menu_item | where: "category", "Desserts" %}
  {% include 'menu-section' category_name: "Desserts", items: desserts %}

</div>
```

- [ ] **Step 2: Commit**

```bash
git add pages/menu.liquid
git commit -m "Build menu page with sticky category nav and grouped sections"
```

---

### Task 15: 404 Page Update

**Files:**
- Modify: `pages/404.liquid`

- [ ] **Step 1: Replace pages/404.liquid**

Replace the entire file with:

```liquid
{% layout 'theme' title: 'Page Not Found', page: '404' %}

<div class="page-404">
  <h1>404</h1>
  <p>This page doesn't exist — but our cocktails do.</p>
  <a href="/" class="btn">Back Home</a>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add pages/404.liquid
git commit -m "Style 404 page with on-brand copy"
```

---

### Task 16: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

```markdown
# Bar & Restaurant — Archival Template

A dark, sophisticated website template for bars and restaurants, built on [Archival](https://archival.dev).

## Customizing Your Site

All content is managed through `.toml` files in the `objects/` directory — or through the Archival editor at [editor.archival.dev](https://editor.archival.dev) (no code required).

### Site Settings (`objects/site.toml`)

| Field | What it does |
|-------|-------------|
| `name` | Your venue's name, shown in the header and hero |
| `tagline` | Short phrase below the name (e.g., "Cocktails & Kitchen") |
| `description` | A paragraph about your venue, shown on the homepage |
| `hero_image` | The large background image on the homepage hero |
| `logo` | Your logo, shown in the header (falls back to text if empty) |
| `address` | Full street address — used for the "Get Directions" link |
| `phone` | Phone number — shown as a clickable link on mobile |
| `email` | Contact email |
| `instagram` | Your Instagram handle (without the @) |
| `hours` | Your operating hours — supports **bold** formatting |
| `reservation_url` | Link to your reservation service (Resy, OpenTable, etc.) |
| `accent_color` | Hex color code (e.g., `#c9a96e`) — changes the accent color across the entire site |

### Menu Items (`objects/menu_item/`)

Each menu item is its own file. To **add a new item**:

1. Create a new `.toml` file in `objects/menu_item/` (e.g., `my-new-dish.toml`)
2. Use this format:

```toml
order = 1
name = "Dish Name"
description = "A short, enticing description."
price = "24"
category = "Entrees"
featured = false
```

- **`order`** — Controls the display order within a category (lower numbers appear first)
- **`price`** — A string, so you can write "18", "Market Price", or "12 / 18"
- **`category`** — Must match one of: `Cocktails`, `Small Plates`, `Entrees`, `Desserts`
- **`featured`** — Set to `true` to show this item on the homepage
- **`image`** — Optional. Add a photo through the Archival editor

### Adding a New Category

To add a new menu category (e.g., "Wine"):

1. Use the new category name in your menu item's `category` field (e.g., `category = "Wine"`)
2. Edit `pages/menu.liquid` and add the new category to both the navigation and the section list:
   - Add `<li><a href="#wine">Wine</a></li>` to the nav
   - Add the assign/include block for the new category

### Events (`objects/event/`)

Each event is its own file. Create a new `.toml` file in `objects/event/`:

```toml
order = 1
title = "Event Name"
date = 2026-05-01
description = """A description of the event. You can use **bold** and *italic* formatting."""
link = "https://tickets.example.com"
```

Remove an event by deleting its file.

### Changing the Accent Color

Edit the `accent_color` field in `objects/site.toml`. Use any hex color code:

- `#c9a96e` — warm gold (default)
- `#e85d4a` — burnt orange
- `#4a90d9` — cool blue
- `#7cb342` — olive green

### Swapping Images

Through the **Archival editor**: Click any image field and upload a new file.

Through **files**: Replace the image reference in the object's `.toml` file. Images are managed by Archival's CDN — upload through the editor for the best experience.

## Local Development

```bash
archival serve
```

Visit `http://localhost:3000` to preview your site.

## All of This Without Code

Everything above can be done through the Archival visual editor at [editor.archival.dev](https://editor.archival.dev) — no files, no terminal, no code. Just edit and publish.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Add user-facing README with customization guide"
```

---

### Task 17: Build and Verify

**Files:** None (verification only)

- [ ] **Step 1: Verify the build**

```bash
archival build
```

Expected: Build completes without errors. The `dist/` directory should contain `index.html`, `menu/index.html` (or `menu.html`), `404.html`, and `style/theme.css`.

- [ ] **Step 2: Verify the output structure**

```bash
find dist -type f | sort
```

Expected: HTML files for index, menu, 404; the CSS file; no broken references.

- [ ] **Step 3: Serve and visually verify**

```bash
archival serve
```

Open `http://localhost:3000` in a browser and check:
- Homepage renders with all sections (hero, featured, about, hours, events, instagram)
- Menu page has sticky nav and all 4 categories with dotted-leader items
- Mobile view works at 375px width
- Nav links work between pages
- 404 page is styled
- No broken images (no `<img>` tags with empty src)
- Accent color is applied (gold on dark background)

- [ ] **Step 4: Fix any issues found, commit fixes**

If any issues are found during verification, fix them and commit each fix separately with a descriptive message.
