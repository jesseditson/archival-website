# Modern Blog Template for Archival

A modern, minimal blog design built on the Archival framework featuring masonry layout and advanced Anime.js 4.2.2 animations.

## Features

### Design
- **Masonry Grid Layout**: Responsive grid that adapts to different screen sizes
- **Modern Minimal Aesthetic**: Clean design with generous whitespace and subtle borders
- **Dark/Light Theme**: Built-in theme toggle with smooth transitions
- **Typography-Focused**: Optimized for readability with carefully selected type scales

### Post Types
The blog supports multiple content types:

1. **Text Posts**: Standard blog posts with title, excerpt, and full content
2. **Image Posts**: Photo-focused entries with captions
3. **Quote Posts**: Highlighted quotations with optional attribution
4. **Link Posts**: Curated links with descriptions

### Animations (Anime.js 4.2.2)
- **Stagger Animations**: Sequential entrance animations for grid items
- **Spring Physics**: Natural, physics-based hover and interaction animations
- **Timeline-Based Transitions**: Orchestrated animation sequences
- **Scroll-Triggered**: Elements animate as they enter the viewport
- **Gallery Navigation**: Smooth transitions between posts with rotation and scale effects

### Post Viewer
- **Full-Screen Overlay**: Distraction-free reading experience
- **Keyboard Navigation**: Arrow keys and Escape key support
- **Touch/Swipe Support**: Mobile-friendly gesture navigation
- **Smooth Transitions**: Beautiful animations between posts

## Structure

### Post Files
Posts are stored as individual TOML files in `objects/post/`:

```toml
order = 1
title = "Post Title"
excerpt = "A short excerpt or description"
date = "2024-11-12"
post_type = "text"  # text, image, quote, link
featured = true
tags = "tag1, tag2"

content = """
Full post content here.
Supports multiple paragraphs.
"""
```

### Post Type Examples

#### Text Post
```toml
post_type = "text"
title = "My Thoughts"
content = "..."
```

#### Image Post
```toml
post_type = "image"
[image]
display_type = "image"
filename = "photo.jpg"
mime = "image/jpeg"
```

#### Quote Post
```toml
post_type = "quote"
quote_author = "Author Name"
content = "The quote text..."
```

#### Link Post
```toml
post_type = "link"
link_url = "https://example.com"
content = "Description of the link..."
```

## Customization

### Colors
Edit CSS custom properties in `public/styles.css`:

```css
:root {
    --bg-primary: #0a0a0a;
    --text-primary: #f5f5f5;
    --accent-primary: #3b82f6;
    /* ... */
}
```

### Typography
Modify font families:

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif;
--font-serif: 'Georgia', 'Times New Roman', serif;
--font-mono: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
```

### Animation Timing
Adjust animation durations and easing in `public/script.js`:

```javascript
animate(element, {
    duration: 600,
    ease: 'outCubic'  // or 'spring(1, 80, 10, 0)'
});
```

## Building

Build the site using Archival CLI:

```bash
archival build
```

Output will be in the `dist/` directory.

## Anime.js 4.2.2 Features Used

- **Spring Physics**: `ease: 'spring(mass, stiffness, damping, velocity)'`
- **Stagger**: `delay: stagger(80, {start: 400})`
- **Timeline**: `createTimeline()` for sequential animations
- **Loop**: `loop: true` for continuous animations
- **Advanced Easing**: `outElastic`, `outCubic`, `outBack`, etc.

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and Flexbox
- Intersection Observer API
- CSS Custom Properties
- Backdrop filter (for blur effects)

## Performance

- Lazy loading for images
- Intersection Observer for scroll animations
- Efficient grid layout with CSS Grid
- Debounced resize handlers
- Preloading of adjacent posts

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Proper heading hierarchy
- Color contrast compliance

## Tips

1. **Featured Posts**: Set `featured = true` to highlight important posts with a star badge
2. **Tags**: Use comma-separated tags for categorization
3. **Order**: Control post order with the `order` field
4. **Images**: Place images in the appropriate uploads directory
5. **Excerpts**: Keep excerpts concise (1-2 sentences) for best layout

## Next Steps

- Add more post types (video, audio, etc.)
- Implement tag filtering
- Add search functionality
- Create archive pages by date
- Add RSS feed generation
- Implement pagination for large post counts
