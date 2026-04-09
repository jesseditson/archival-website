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
archival run
```

Visit `http://localhost:3000` to preview your site.

## All of This Without Code

Everything above can be done through the Archival visual editor at [editor.archival.dev](https://editor.archival.dev) — no files, no terminal, no code. Just edit and publish.
