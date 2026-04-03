# Bar/Restaurant Archival Template — Design Spec

## Overview

A production-quality Archival starter template for bars and restaurants. Dark, sophisticated aesthetic targeting upscale cocktail bars and contemporary restaurants. Immediately usable by a non-technical owner through the Archival editor.

**Branch**: `templates/bar-restaurant-1` (branched from `templates/new`)

---

## Visual Design

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0a` | Page background |
| `--bg-surface` | `#141414` | Cards, sections with contrast |
| `--bg-surface-hover` | `#1a1a1a` | Hover states on surfaces |
| `--text-primary` | `#f5f0e8` | Headings, primary text (warm white) |
| `--text-secondary` | `#9a9088` | Body text, descriptions |
| `--text-muted` | `#555555` | Tertiary text, inactive nav |
| `--accent` | `#c9a96e` (default) | Accent color — dynamically set from `objects.site.accent_color` |
| `--border` | `#1a1a1a` | Subtle dividers |

All colors meet WCAG AA contrast against their intended backgrounds.

### Typography

- **Heading font**: Cormorant Garamond (weights: 400, 600, 700) — used for venue name, section titles, menu item names
- **Body font**: Outfit (weights: 300, 400, 500) — used for descriptions, UI text, navigation
- **Source**: Google Fonts
- **Scale**: Generous sizing for headings (clamp-based for responsiveness), 14-16px body text, generous line-height (1.6-1.7 for body)

### Motion

- CSS-only animations, no JS frameworks
- Fade-in on scroll using `animation-timeline: view()` with fallback (elements visible by default if unsupported)
- Hover transitions on CTAs (background/border color, 0.3s ease)
- Hover transitions on menu items (subtle highlight)
- Header background transition from transparent to solid on scroll (CSS `position: sticky` approach)

---

## Content Model (objects.toml)

### site (singleton)

| Field | Type | Purpose |
|-------|------|---------|
| name | string | Venue name ("The Gilded Hour") |
| tagline | string | Short tagline ("Cocktails & Kitchen") |
| description | markdown | About/vibe paragraph for homepage |
| hero_image | image | Full-viewport hero background |
| logo | image | Logo for header/footer |
| address | string | Full street address |
| phone | string | Phone number |
| email | string | Contact email |
| instagram | string | Instagram handle (without @) |
| hours | markdown | Multi-line operating hours |
| reservation_url | string | Link to reservation service |
| accent_color | string | Hex color for --accent CSS variable |

### menu_item (collection)

| Field | Type | Purpose |
|-------|------|---------|
| name | string | Item name |
| description | string | Short evocative description (1-2 sentences) |
| price | string | Price as string — allows "18", "Market Price", "12 / 18" |
| category | string | Grouping field — "Cocktails", "Small Plates", "Entrees", "Desserts" |
| featured | boolean | Show on homepage featured section |
| image | image | Optional item photo |

Uses the Archival grouping pattern: each item is its own `.toml` file, `category` string groups them. Templates filter with `{% assign items = objects.menu_item | where: "category", "Cocktails" %}`.

The `order` field (reserved by Archival) controls display order within each category.

### event (collection)

| Field | Type | Purpose |
|-------|------|---------|
| title | string | Event name |
| date | date | Event date |
| description | markdown | Event details |
| image | image | Optional event image |
| link | string | Ticket/RSVP URL |

---

## Example Content

### Venue

- **Name**: The Gilded Hour
- **Tagline**: Cocktails & Kitchen
- **City**: Los Angeles, CA
- **Address**: Fictional address on a real-sounding LA street (e.g., "742 N La Brea Ave, Los Angeles, CA 90038")
- **Hours**: Tue-Thu 5pm-12am, Fri-Sat 5pm-2am, Sun 4pm-11pm, Mon Closed
- **Accent**: #c9a96e

### Menu Items (10 items across 4 categories)

**Cocktails** (3 items):
- Smoked Old Fashioned — 18
- Lavender Collins — 16
- Midnight in Oaxaca — 20

**Small Plates** (3 items):
- Charred Shishito Peppers — 12
- Tuna Tartare — 19
- Burrata & Stone Fruit — 17

**Entrees** (3 items):
- Wagyu Burger — 28
- Pan-Seared Branzino — 36
- Mushroom Risotto — 24

**Desserts** (1 item):
- Dark Chocolate Fondant — 14

Featured items: Smoked Old Fashioned, Tuna Tartare, Wagyu Burger

### Events (3)
- Live Jazz Friday (recurring Friday night)
- Winemaker's Dinner (special tasting event)
- Golden Hour Happy Hour (weekly deal)

---

## File Structure

```
archival_template.toml          # Template metadata
archival_editor.toml            # Editor UI configuration
manifest.toml                   # archival_version = "0.5.0"
objects.toml                    # Schema definitions
objects/
  site.toml                     # Singleton venue data
  menu_item/
    smoked-old-fashioned.toml
    lavender-collins.toml
    midnight-in-oaxaca.toml
    charred-shishito-peppers.toml
    tuna-tartare.toml
    burrata-stone-fruit.toml
    wagyu-burger.toml
    pan-seared-branzino.toml
    mushroom-risotto.toml
    dark-chocolate-fondant.toml
  event/
    live-jazz-friday.toml
    winemakers-dinner.toml
    golden-hour-happy-hour.toml
pages/
  index.liquid                  # Homepage
  menu.liquid                   # Menu page
  _header.liquid                # Site header/nav partial
  _footer.liquid                # Footer partial
  _menu-section.liquid          # Menu category section partial
  _event-card.liquid            # Event card partial
layout/
  theme.liquid                  # Base HTML layout
style/
  theme.css                     # All CSS
README.md                       # User-facing documentation
```

---

## Pages

### layout/theme.liquid

Base HTML document shell:
- `<!DOCTYPE html>`, charset, viewport meta
- `<meta name="description">` from `{{ objects.site.description | strip_html | truncate: 160 }}`
- Open Graph tags (og:title, og:description, og:image from hero_image)
- Google Fonts `<link>` for Cormorant Garamond (400, 600, 700, 400i) and Outfit (300, 400, 500)
- Link to `style/theme.css`
- Inline `<style>` block setting `--accent: {{ objects.site.accent_color }};` on `:root`
- Include `_header` partial
- `{{ page_content }}`
- Include `_footer` partial

Accepts layout variables: `title` (for `<title>` tag), `page` (for active nav highlighting).

### pages/index.liquid

Layout declaration: `{% layout 'theme' title: objects.site.name, page: 'home' %}`

**Section 1 — Hero:**
- Full-viewport height div with hero_image as CSS background (cover, center)
- Dark overlay gradient for text readability
- Venue name in large Cormorant Garamond
- Tagline below
- Two CTAs: "View Menu" (link to /menu) and "Reserve a Table" (link to reservation_url)
- Graceful degradation: if no hero_image, show a solid dark background with the text

**Section 2 — Featured Items:**
- Section heading ("From Our Kitchen & Bar" or similar)
- Filter: `{% assign featured = objects.menu_item | where: "featured", true %}`
- Display 3-4 items in a grid: item name, description, price
- If item has image, show it; if not, show name/description only (no broken img)

**Section 3 — About / Vibe:**
- Site description rendered from markdown
- Could include a secondary mood image if available

**Section 4 — Hours & Location:**
- Address with "Get Directions" link (Google Maps URL using the address)
- Hours rendered from markdown
- Phone number as clickable tel: link
- Email as clickable mailto: link

**Section 5 — Events:**
- Conditional: only render if events exist (`{% if objects.event.size > 0 %}`)
- Use `_event-card` partial for each event
- Compact card layout (1-3 cards)

**Section 6 — Instagram CTA:**
- Simple "Follow Us" text with link to `https://instagram.com/{{ objects.site.instagram }}`
- Only render if instagram field is populated

### pages/menu.liquid

Layout declaration: `{% layout 'theme' title: 'Menu', page: 'menu' %}`

**Sticky Category Navigation:**
- Horizontal list of category names as anchor links (#cocktails, #small-plates, etc.)
- Sticks to top on scroll (below the site header)
- Active state highlights current section (CSS-only via scroll position if feasible, otherwise static)

**Menu Sections:**
- Iterate through known categories in order: Cocktails, Small Plates, Entrees, Desserts
- For each: `{% assign items = objects.menu_item | where: "category", "Cocktails" %}`
- Render via `{% include 'menu-section' category_name: "Cocktails", items: items %}`
- Each section has an id anchor for the sticky nav

**Note in README**: Adding a new category requires adding the category name to the iteration list in menu.liquid and the sticky nav. Everything else (adding items within existing categories) is automatic.

### pages/_header.liquid

- Logo/site name linking to home
- Navigation links: Home, Menu
- Reserve CTA button (links to reservation_url)
- Transparent background by default, solid on scroll via `position: sticky` with background transition
- Mobile: hamburger menu or minimal collapsed nav (CSS-only)

### pages/_footer.liquid

- Address, phone, hours summary
- Instagram link
- "Powered by Archival" credit
- Same dark styling as the rest

### pages/_menu-section.liquid

Accepts: `category_name` (string), `items` (filtered array)

- Category heading (Cormorant Garamond, accent color) with id anchor
- Centered container (max-width ~600px)
- For each item:
  - If item has image: show image above the item (optional enhancement)
  - Item name (Cormorant Garamond, warm white) ... dotted leader ... price (accent color)
  - Description below (Outfit light, muted text)
- Graceful empty state: if no items in category, don't render the section

### pages/_event-card.liquid

Accepts: individual event object properties

- Event image (if present) as card background or top image
- Title, formatted date, description excerpt
- "Learn More" link if link field is populated

---

## CSS Architecture (style/theme.css)

### Structure

1. **Custom properties** — all design tokens on `:root`
2. **Reset/base** — minimal reset, box-sizing, smooth scrolling
3. **Typography** — heading styles, body text, links
4. **Layout utilities** — container widths, section spacing
5. **Header** — sticky nav, transparent-to-solid transition, mobile menu
6. **Hero** — full-viewport, overlay, CTA buttons
7. **Featured section** — grid layout for featured items
8. **Menu page** — centered layout, dotted leaders, sticky category nav
9. **Events** — card grid
10. **Footer** — dark footer styling
11. **Animations** — `@keyframes fadeInUp`, `animation-timeline: view()` with `@supports` fallback
12. **Print styles** — `@media print` block: hide nav/footer, light background, adjusted colors
13. **Responsive** — mobile-first with breakpoints at ~768px and ~1024px

### Key CSS Patterns

**Dotted leader for menu items:**
```css
.menu-item-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.menu-item-header::after {
  content: '';
  flex: 1;
  border-bottom: 1px dotted var(--border);
}
```
(Or use a span-based approach as shown in the mockup)

**Dynamic accent color:**
```css
:root {
  --accent: #c9a96e; /* fallback */
}
```
Overridden in theme.liquid inline style: `:root { --accent: {{ objects.site.accent_color }}; }`

**Scroll-triggered fade-in:**
```css
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
  }
}
```

---

## Image Handling

All image references must be conditional to avoid broken `<img>` tags:

```liquid
{% if item.image.url %}
  <img src="{{ item.image.url }}" alt="{{ item.name }}">
{% endif %}
```

The template must look complete and polished even with zero images uploaded (a new user's starting state).

---

## Accessibility

- Semantic HTML: proper heading hierarchy (h1 → h2 → h3), nav elements, main, footer
- Alt text on all images (from object name fields)
- Aria labels on navigation, social links
- Sufficient color contrast (all text/background combos meet WCAG AA)
- Clickable phone (tel:) and email (mailto:) links
- Skip-to-content link (hidden, visible on focus)
- Focus-visible styles on interactive elements

---

## README.md

User-facing documentation covering:
1. What the template is for
2. How to customize content through the Archival editor
3. How to add new menu items and categories (step-by-step)
4. How to change the accent color
5. How to manage events
6. How to swap images
7. Note about editor.archival.dev for no-code editing
