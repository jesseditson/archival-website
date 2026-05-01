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
| `og_image` | Optional override for the social-share preview image (defaults to `hero_image`) |

### Menu Categories & Items

Both categories and the items inside them live in `objects/site.toml`. Each `[[category]]` owns its own list of `[[category.menu_item]]` entries, so the editor groups items under their category visually with add/remove/reorder buttons at each level.

To **add a new item**, append a `[[category.menu_item]]` block under the appropriate `[[category]]`:

```toml
[[category]]
name = "Entrees"

  [[category.menu_item]]
  name = "Dish Name"
  description = "A short, enticing description."
  price = "24"
  featured = false
```

Field reference:

- **`name`** — The dish or drink name.
- **`description`** — A short tagline; shown on the menu page and on the homepage if featured.
- **`price`** — A string, so you can write `"18"`, `"Market Price"`, or `"12 / 18"`.
- **`featured`** — Set to `true` to surface this item in the "Signatures" block on the homepage.

Items render in the order they appear in `site.toml`.

### Adding a New Category

To add a new menu category (e.g., "Wine"), append a `[[category]]` block to `objects/site.toml`:

```toml
[[category]]
name = "Wine"

  [[category.menu_item]]
  name = "Sangiovese"
  description = "Cherry, leather, and a hint of cedar."
  price = "14"
  featured = false
```

The menu page nav and sections render automatically from your category list — no template edits required. Reorder categories by rearranging their `[[category]]` blocks.

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

The accent color is defined as `--accent` in `public/style/theme.css` (default `#c9a96e` — warm gold). To use a different color, edit that variable. Examples:

- `#c9a96e` — warm gold (default)
- `#e85d4a` — burnt orange
- `#4a90d9` — cool blue
- `#7cb342` — olive green

### Swapping Images

Through the **Archival editor**: Click any image field and upload a new file.

Through **files**: Replace the image reference in the object's `.toml` file. Images are managed by Archival's CDN — upload through the editor for the best experience.

## Local Development

```bash
archival run
```

Visit `http://localhost:3000` to preview your site.

## All of This Without Code

Everything above can be done through the Archival visual editor at [editor.archival.dev](https://editor.archival.dev) — no files, no terminal, no code. Just edit and publish.
