# Podcast Audio Playback + RSS Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hook the existing audio player up to a real CDN-hosted test track, and emit a podcast-spec RSS feed at `/rss.xml`.

**Architecture:** Promote the `audio_url` field on the `episode` object from `string` to Archival's `audio` upload type, attach the same shared upload metadata to all 7 episodes, update Liquid templates to dereference `.url`, add a new `pages/rss.xml.liquid` that renders an iTunes-namespaced RSS 2.0 feed, and advertise the feed via `<link rel="alternate">` in the theme head.

**Tech Stack:** Archival CMS (Liquid templates, TOML object definitions), `./bin/archival` CLI for build verification.

**Spec:** `docs/superpowers/specs/2026-04-30-podcast-audio-and-rss-design.md`

**Commit policy:** Single author. Do NOT add a `Co-Authored-By:` trailer to any commit in this plan.

---

## File Structure

**Modify:**
- `objects.toml` — change `audio_url` type from `string` to `audio`
- `objects/episode/episode-1.toml` through `episode-7.toml` — replace `audio_url = "..."` with `[audio_url]` upload table
- `pages/index.liquid` — dereference `.url` and guard play handlers
- `pages/episodes/index.liquid` — same
- `pages/episode.liquid` — same
- `layout/theme.liquid` — add RSS `<link rel="alternate">` in `<head>`

**Create:**
- `pages/rss.xml.liquid` — podcast-spec RSS feed

**Verify with:** `./bin/archival build` produces `dist/rss.xml` and the site loads in a browser without console errors.

---

### Task 1: Migrate the `audio_url` field type and one episode

This task is a vertical slice: change the schema, update one episode to the new shape, and confirm the build still passes. The remaining 6 episodes are bulk-migrated in Task 2.

**Files:**
- Modify: `objects.toml`
- Modify: `objects/episode/episode-1.toml`

- [ ] **Step 1: Update the field type in `objects.toml`**

In `objects.toml`, change line `audio_url = "string"` (under `[episode]`) to:

```toml
audio_url = "audio"
```

- [ ] **Step 2: Convert episode-1.toml to the upload object shape**

Open `objects/episode/episode-1.toml`. Remove the line:

```toml
audio_url = "/audio/episode-1.mp3"
```

Append (TOML tables must come after all bare keys):

```toml
[audio_url]
uploaded = 9
sha = "ddc7cec156c15a22718064968c13b0ca7c7bf245efbff9fb833c208753c77904"
filename = "band-track-01.mp3"
mime = "audio/mpeg"
display_type = "audio"
```

The full file should now look like:

```toml
number = 1
title = "Our first episode"
slug = "our-first-episode"
description = """
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ac ultrices odio. 
We're getting started with a very cool episode.
"""
duration = "47:18"
publish_date = "2024-12-01"
featured = false
draft = false
tag1 = "music"
tag2 = "news"
host1 = "host-1"
host2 = "host-2"
order = 1

[audio_url]
uploaded = 9
sha = "ddc7cec156c15a22718064968c13b0ca7c7bf245efbff9fb833c208753c77904"
filename = "band-track-01.mp3"
mime = "audio/mpeg"
display_type = "audio"
```

- [ ] **Step 3: Build and verify episode-1 still validates**

Run: `./bin/archival build`

Expected: build completes without errors. (Other episodes will not yet have the new shape but Archival should tolerate missing/empty audio fields — if the build fails because non-migrated episodes are now invalid, the failure surfaces here, not in production.)

If the build hard-fails because the other episodes have the wrong type, that is fine — Task 2 immediately fixes it. Move on.

- [ ] **Step 4: Commit**

```bash
git add objects.toml objects/episode/episode-1.toml
git commit -m "Promote episode audio_url field to audio upload type"
```

---

### Task 2: Migrate the remaining 6 episodes

**Files:**
- Modify: `objects/episode/episode-2.toml`
- Modify: `objects/episode/episode-3.toml`
- Modify: `objects/episode/episode-4.toml`
- Modify: `objects/episode/episode-5.toml`
- Modify: `objects/episode/episode-6.toml`
- Modify: `objects/episode/episode-7.toml`

- [ ] **Step 1: Apply the same edit pattern to each remaining episode**

For each of `episode-2.toml` through `episode-7.toml`:

1. Delete the existing `audio_url = "/audio/episode-N.mp3"` line.
2. Append this block at the end of the file (after the existing bare keys):

```toml
[audio_url]
uploaded = 9
sha = "ddc7cec156c15a22718064968c13b0ca7c7bf245efbff9fb833c208753c77904"
filename = "band-track-01.mp3"
mime = "audio/mpeg"
display_type = "audio"
```

The same audio is intentionally shared across all 7 episodes (template test content).

- [ ] **Step 2: Build and verify**

Run: `./bin/archival build`

Expected: build completes with no errors. `dist/index.html` and `dist/episodes/index.html` regenerate.

- [ ] **Step 3: Commit**

```bash
git add objects/episode/episode-2.toml objects/episode/episode-3.toml objects/episode/episode-4.toml objects/episode/episode-5.toml objects/episode/episode-6.toml objects/episode/episode-7.toml
git commit -m "Attach shared test audio to remaining episodes"
```

---

### Task 3: Update Liquid templates to dereference `.url`

Templates currently treat `audio_url` as a string. After Tasks 1–2 it's an upload object, so `{{ ep.audio_url }}` would render an empty/garbage value. We dereference `.url` and guard each call site so episodes without audio degrade silently (per existing template patterns for nil image access).

**Files:**
- Modify: `pages/index.liquid`
- Modify: `pages/episodes/index.liquid`
- Modify: `pages/episode.liquid`

- [ ] **Step 1: Update `pages/index.liquid` — hero CTA**

Find:

```liquid
    {% assign latest_episode = episode | where: "draft", false | sort: "order" | reverse | first %}
    {% if latest_episode %}
    <button class="cta-button" onclick="playEpisode('{{ latest_episode.audio_url }}', '{{ latest_episode.title }}')">
      LISTEN TO LATEST EPISODE
    </button>
    {% endif %}
```

Replace with:

```liquid
    {% assign latest_episode = episode | where: "draft", false | sort: "order" | reverse | first %}
    {% if latest_episode and latest_episode.audio_url %}
    <button class="cta-button" onclick="playEpisode('{{ latest_episode.audio_url.url }}', '{{ latest_episode.title }}')">
      LISTEN TO LATEST EPISODE
    </button>
    {% endif %}
```

- [ ] **Step 2: Update `pages/index.liquid` — featured episode card**

Find:

```liquid
      <div class="episode-image"
        onclick="playEpisode('{{ featured_episode.audio_url }}', '{{ featured_episode.title }}')">
```

Replace with:

```liquid
      <div class="episode-image"
        {% if featured_episode.audio_url %}onclick="playEpisode('{{ featured_episode.audio_url.url }}', '{{ featured_episode.title }}')"{% endif %}>
```

- [ ] **Step 3: Update `pages/index.liquid` — recent episodes grid**

Find:

```liquid
        <div class="episode-image" onclick="playEpisode('{{ ep.audio_url }}', '{{ ep.title }}')">
```

Replace with:

```liquid
        <div class="episode-image" {% if ep.audio_url %}onclick="playEpisode('{{ ep.audio_url.url }}', '{{ ep.title }}')"{% endif %}>
```

- [ ] **Step 4: Update `pages/episodes/index.liquid`**

Find:

```liquid
        <div class="episode-image" onclick="playEpisode('{{ ep.audio_url }}', '{{ ep.title }}')">
```

Replace with:

```liquid
        <div class="episode-image" {% if ep.audio_url %}onclick="playEpisode('{{ ep.audio_url.url }}', '{{ ep.title }}')"{% endif %}>
```

- [ ] **Step 5: Update `pages/episode.liquid` — header artwork**

Find:

```liquid
      <div class="episode-image-large" onclick="playEpisode('{{ episode.audio_url }}', '{{ episode.title }}')">
```

Replace with:

```liquid
      <div class="episode-image-large" {% if episode.audio_url %}onclick="playEpisode('{{ episode.audio_url.url }}', '{{ episode.title }}')"{% endif %}>
```

- [ ] **Step 6: Update `pages/episode.liquid` — Play Episode button**

Find:

```liquid
      <!-- Audio Player -->
      <div class="episode-player">
        <h3>Listen to this episode</h3>
        <button class="play-episode-btn" onclick="playEpisode('{{ episode.audio_url }}', '{{ episode.title }}')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play Episode
        </button>
      </div>
```

Replace with:

```liquid
      <!-- Audio Player -->
      {% if episode.audio_url %}
      <div class="episode-player">
        <h3>Listen to this episode</h3>
        <button class="play-episode-btn" onclick="playEpisode('{{ episode.audio_url.url }}', '{{ episode.title }}')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play Episode
        </button>
      </div>
      {% endif %}
```

- [ ] **Step 7: Build and verify**

Run: `./bin/archival build`

Expected: build completes without errors.

Verify the generated HTML actually contains real CDN URLs, not empty strings:

```bash
grep -o "playEpisode('[^']*'" dist/index.html | head -3
```

Expected output: lines like `playEpisode('https://...ddc7cec156c15a...'` (the URL points at Archival's CDN with the sha).

- [ ] **Step 8: Manually verify in a browser**

Run: `./bin/archival run`

Open the printed local URL. On the home page, click any episode card's play button and confirm the player widget begins playing audio (the test track plays a band track). Click "BROWSE ALL EPISODES" → click a play button there → confirm audio plays. Open an individual episode page → click the large header artwork or the "Play Episode" button → confirm audio plays.

Stop the server (Ctrl+C) when done.

- [ ] **Step 9: Commit**

```bash
git add pages/index.liquid pages/episodes/index.liquid pages/episode.liquid
git commit -m "Dereference audio_url.url and guard play handlers in templates"
```

---

### Task 4: Add the RSS feed

**Files:**
- Create: `pages/rss.xml.liquid`

- [ ] **Step 1: Create `pages/rss.xml.liquid`**

Create the file with this exact content:

```liquid
{% assign podcast = objects.podcast %}
{% assign settings = objects.settings %}
{% assign episode = objects.episode %}
{% assign site_url = podcast.website_url %}
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>{{ podcast.title }}</title>
    <link>{{ site_url }}</link>
    <description>{{ podcast.description | strip_html }}</description>
    <language>en-us</language>
    <lastBuildDate>{{ "now" | date: "%a, %d %b %Y %H:%M:%S %z" }}</lastBuildDate>
    <itunes:author>{{ podcast.title }}</itunes:author>
    <itunes:summary>{{ podcast.subtitle }}</itunes:summary>
    <itunes:owner>
      <itunes:name>{{ podcast.title }}</itunes:name>
      <itunes:email>{{ podcast.email }}</itunes:email>
    </itunes:owner>
    {% if podcast.logo %}
    <itunes:image href="{{ site_url }}{{ podcast.logo }}"/>
    {% endif %}
    <itunes:category text="Technology"/>
    <itunes:explicit>false</itunes:explicit>
    {% assign feed_episodes = episode | where: "draft", false | sort: "order" | reverse %}
    {% for ep in feed_episodes %}
    {% if ep.audio_url %}
    <item>
      <title>{{ ep.title }}</title>
      <link>{{ site_url }}/episode/episode-{{ ep.number }}.html</link>
      <guid isPermaLink="true">{{ site_url }}/episode/episode-{{ ep.number }}.html</guid>
      <description><![CDATA[{{ ep.description }}]]></description>
      <pubDate>{{ ep.publish_date | date: "%a, %d %b %Y %H:%M:%S %z" }}</pubDate>
      <enclosure url="{{ ep.audio_url.url }}" length="0" type="{{ ep.audio_url.mime }}"/>
      <itunes:duration>{{ ep.duration }}</itunes:duration>
      <itunes:episode>{{ ep.number }}</itunes:episode>
      <itunes:explicit>false</itunes:explicit>
    </item>
    {% endif %}
    {% endfor %}
  </channel>
</rss>
```

Notes for the engineer:

- `enclosure length="0"` is intentional — Archival doesn't expose file size and Apple Podcasts tolerates `0` (falls back to a HEAD request).
- `<itunes:category text="Technology"/>` is hardcoded because the `[podcast]` schema has no category field. A future enhancement could add one.
- `pubDate` uses RFC 2822 format (required by RSS 2.0).
- The `{% if ep.audio_url %}` guard around each item ensures episodes without audio don't emit broken `<enclosure>` tags.

- [ ] **Step 2: Build and verify the RSS file is generated**

Run: `./bin/archival build`

Expected: build completes. `dist/rss.xml` exists.

```bash
ls -la dist/rss.xml
```

- [ ] **Step 3: Verify the feed structure**

```bash
head -20 dist/rss.xml
```

Expected: starts with `<?xml version="1.0" encoding="UTF-8"?>`, includes `xmlns:itunes`, includes channel-level `<title>The Verge Podcast</title>`.

```bash
grep -c "<item>" dist/rss.xml
```

Expected: `7` (all episodes have audio attached).

```bash
grep "enclosure" dist/rss.xml | head -1
```

Expected: an `<enclosure>` line with the CDN URL containing `ddc7cec156c15a...` and `type="audio/mpeg"`.

- [ ] **Step 4: Validate with an XML parser**

```bash
xmllint --noout dist/rss.xml && echo "XML OK"
```

Expected: prints `XML OK`. If `xmllint` is unavailable, skip this step (the structural greps in Step 3 give reasonable confidence).

- [ ] **Step 5: Commit**

```bash
git add pages/rss.xml.liquid
git commit -m "Add podcast-spec RSS feed at /rss.xml"
```

---

### Task 5: Advertise the feed in the theme `<head>`

**Files:**
- Modify: `layout/theme.liquid`

- [ ] **Step 1: Add the `<link rel="alternate">` tag**

In `layout/theme.liquid`, find the `<!-- Styles -->` block:

```liquid
  <!-- Styles -->
  <link rel="stylesheet" href="/css/style.css">
</head>
```

Replace with:

```liquid
  <!-- Styles -->
  <link rel="stylesheet" href="/css/style.css">

  <!-- RSS Feed -->
  <link rel="alternate" type="application/rss+xml" title="{{ podcast.title }} RSS Feed" href="{{ podcast.website_url }}/rss.xml">
</head>
```

- [ ] **Step 2: Build and verify**

Run: `./bin/archival build`

```bash
grep "application/rss" dist/index.html
```

Expected: a line like `<link rel="alternate" type="application/rss+xml" title="The Verge Podcast RSS Feed" href="https://theverge.com/rss.xml">`.

- [ ] **Step 3: Commit**

```bash
git add layout/theme.liquid
git commit -m "Advertise RSS feed via link rel=alternate in head"
```

---

### Task 6: Final end-to-end smoke test

- [ ] **Step 1: Clean rebuild**

```bash
rm -rf dist && ./bin/archival build
```

Expected: build succeeds, no errors.

- [ ] **Step 2: Run the local server and exercise the player**

```bash
./bin/archival run
```

Open the printed URL. Verify:

1. Home page hero "LISTEN TO LATEST EPISODE" button plays audio.
2. Featured episode card play button plays audio.
3. Recent episode card play buttons play audio.
4. `/episodes/` grid play buttons play audio.
5. An individual episode page (`/episode/episode-1.html`) — both the header artwork and the "Play Episode" button play audio.
6. Browser DevTools → Network: confirm requests go to a real CDN URL, not `/audio/episode-N.mp3`.
7. View source on the home page: confirm the `<link rel="alternate" type="application/rss+xml">` tag is present.
8. Visit `/rss.xml` directly: confirm the feed renders with all 7 items.

Stop the server (Ctrl+C).

- [ ] **Step 3: Optional — validate the feed with an external podcast validator**

If you have internet access and want extra confidence, paste the contents of `dist/rss.xml` into:

- `https://validator.w3.org/feed/` (general RSS validity)
- `https://podba.se/validate/` (podcast-specific iTunes namespace checks)

A few warnings about `length="0"` and the hardcoded `<itunes:category>` are expected and documented in the spec.

No commit needed for the smoke test.
