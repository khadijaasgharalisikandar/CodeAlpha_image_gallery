# Lumen — Image Gallery

An editorial-style, magazine-inspired image gallery with category filters and a lightbox viewer, built with vanilla HTML, CSS, and JavaScript.

## Features

- Masonry-style responsive grid (Pinterest-like layout, adapts column count to screen size)
- Full-bleed hero header with title and tagline
- Category filters — All, Nature, Architecture, Travel, Food — with a live photo count
- 16 real, category-matched photos (Unsplash)
- Lightbox view with next/previous navigation and position dots
- Hover zoom, frame, and "view" icon reveal on gallery cards
- Staggered fade-in animation as cards load
- Full keyboard support in lightbox — `←` / `→` to navigate, `Esc` to close
- Click outside the image to close the lightbox
- Respects `prefers-reduced-motion` for accessibility
- **Upload your own photos** — click "+ Upload" to add images from your device. They're saved in your browser (via IndexedDB) so they're still there next time you open the site, and you can delete them from the gallery.

> **Note on uploads:** This is a static site with no server or database, so uploaded photos are stored only in the browser that uploaded them — they are not shared with other visitors. To make uploads visible to everyone, you'd need to add a backend (e.g. Firebase, Supabase, or a custom API) to store and serve images centrally.

## Project structure

```
gallery/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run it

Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .
```

## How it works

All image data lives in a single array in `script.js`:

```js
const images = [
  { id: 1, title: "Misty Forest Path", category: "nature", src: "..." },
  ...
];
```

- `renderGallery()` draws the cards and hides any that don't match the active filter.
- Filter buttons update `currentFilter` and re-render.
- The lightbox tracks `currentIndex` and only cycles through images matching the current filter, so next/prev stays in sync with what's visible on the grid.

## Swap in your own images

Replace the `src` values in the `images` array in `script.js` with your own image paths or URLs, and update `title`/`category` to match.

## License

Free to use and modify.
