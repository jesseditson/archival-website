# Podcast audio playback + RSS feed

**Date:** 2026-04-30
**Branch:** templates/podcast-1

## Goal

Hook the existing audio player up to real audio content, and expose a podcast-spec RSS feed so this template is publishable to Apple Podcasts / Spotify out of the box.

## Background

The template currently has:

- A polished player widget in `layout/theme.liquid` driven by `public/js/player.js`.
- 7 episodes in `objects/episode/` whose `audio_url` is a string pointing at non-existent files (`/audio/episode-N.mp3`).
- No RSS feed.

The user has provided one CDN-hosted test asset (an Archival audio upload) to use for all episodes during template development:

```toml
uploaded = 9
sha = "ddc7cec156c15a22718064968c13b0ca7c7bf245efbff9fb833c208753c77904"
filename = "band-track-01.mp3"
mime = "audio/mpeg"
display_type = "audio"
```

## Changes

### 1. Audio field type

`objects.toml`:

```toml
[episode]
...
audio_url = "audio"   # was "string"
```

The field name (`audio_url`) is preserved to minimize template churn, even though the value is now an upload object rather than a URL string.

### 2. Episode data

Each of `objects/episode/episode-{1..7}.toml` replaces the `audio_url = "..."` line with:

```toml
[audio_url]
uploaded = 9
sha = "ddc7cec156c15a22718064968c13b0ca7c7bf245efbff9fb833c208753c77904"
filename = "band-track-01.mp3"
mime = "audio/mpeg"
display_type = "audio"
```

All 7 episodes share the same audio for testing.

### 3. Liquid template updates

Change every `{{ ep.audio_url }}` reference to `{{ ep.audio_url.url }}` and guard each `playEpisode(...)` call with `{% if ep.audio_url %}` so episodes without an upload degrade gracefully (no broken `onclick` handler).

Files:

- `pages/index.liquid` — hero CTA, featured episode card, recent episodes grid (3 sites)
- `pages/episodes/index.liquid` — episodes grid (1 site)
- `pages/episode.liquid` — header artwork onclick, "Play Episode" button (2 sites)

### 4. RSS feed

New file: `pages/rss.xml.liquid` → renders to `dist/rss.xml`.

Channel-level elements:

- Standard RSS: `title`, `link`, `description`, `language`, `lastBuildDate`
- iTunes namespace: `itunes:author`, `itunes:summary`, `itunes:owner` (name + email from `podcast.email`), `itunes:image` (from `podcast.logo`, made absolute via `podcast.website_url`), `itunes:category`, `itunes:explicit`

Per-item elements:

- `title`, `description` (CDATA-wrapped to allow markdown HTML), `pubDate` (RFC 2822: `%a, %d %b %Y %H:%M:%S %z`), `guid` (absolute episode URL), `itunes:duration`, `itunes:episode`
- `<enclosure url="{{ ep.audio_url.url }}" length="0" type="{{ ep.audio_url.mime }}"/>`

Item ordering: filter `draft = false`, sort by `order` ascending then reverse (newest first), matching the home page convention.

### 5. Discovery link

In `layout/theme.liquid` `<head>`:

```html
<link rel="alternate" type="application/rss+xml" title="{{ podcast.title }} RSS Feed" href="{{ podcast.website_url }}/rss.xml">
```

## Constraints / known limitations

- **`<enclosure length>`** is set to `0` because Archival's audio upload metadata doesn't expose file size. Apple Podcasts tolerates this; strict aggregators may not.
- **Absolute URLs** in the RSS feed require `podcast.website_url` to be populated. The template currently has `https://theverge.com` set, so this works out of the box. A user who clears that field will produce a feed with relative links — acceptable for the template default.
- **iTunes `category`** is hardcoded to `"Technology"` since no category field exists on `[podcast]`. Adding one would be a future enhancement; out of scope here.

## Out of scope

- Adding a podcast category / language / explicit field to the `[podcast]` schema.
- Per-episode audio uploads (all 7 share one file deliberately, for template testing).
- File-size lookup for `<enclosure length>`.
- Renaming `audio_url` → `audio` (would break the migration story for existing template users).

## Test plan

1. Run `archival build` (or equivalent) and confirm `dist/rss.xml` renders.
2. Validate with an RSS validator (`https://validator.w3.org/feed/`) and a podcast-specific validator (`https://podba.se/validate/`).
3. In the browser: click any episode play button on home / episodes / episode detail pages and confirm the player loads + plays the test track.
4. Confirm `<link rel="alternate">` appears in `<head>` and points at `/rss.xml`.
