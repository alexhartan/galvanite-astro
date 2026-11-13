# CLAUDE.md

Guidelines for building marketing websites with Astro. Follow these on every task in this repo.

## Priorities (in order)

1. Performance: ship zero JS by default, fast LCP, no layout shift
2. Accessibility and semantic HTML
3. Maintainability: reusable components, no one-off styles
4. Visual fidelity to the design system

## Stack

- **Astro** (latest stable), static output (`output: 'static'`) unless a page genuinely needs SSR
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (not the deprecated `@astrojs/tailwind` integration)
- **TypeScript** in strict mode for component props and config
- **astro:assets** for all images
- **GSAP** only as an animation fallback (see Animation hierarchy)
- No UI framework (React, Vue, Svelte) unless a component needs heavy client state. Ask before adding one.
- Never add a dependency without asking first. Justify it by size and need.

## Project structure

```
src/
  components/
    ui/          # primitives: Button, Link, Heading, Icon, Container
    sections/    # page sections: Hero, Features, Pricing, CTA, Footer
  layouts/       # BaseLayout.astro (head, meta, fonts, global styles)
  pages/         # routes only, compose sections, minimal markup
  content/       # content collections (blog, case studies)
  assets/        # images processed by astro:assets
  styles/
    global.css   # @import "tailwindcss"; @theme tokens; base layer
  scripts/       # small vanilla JS modules, only if needed
public/          # files served as-is: favicon, robots.txt, og images, fonts
```

- One component per file, PascalCase names.
- Pages compose sections. Sections compose UI primitives. No raw styling decisions inside pages.
- Define a typed `Props` interface in every component. Use sensible defaults.
- Use slots for flexible content instead of long prop lists.
- Content that repeats (posts, team, logos, testimonials) lives in content collections with a Zod schema, not hardcoded arrays.

## Styling (Tailwind)

- Tailwind utilities only. No custom CSS unless Tailwind cannot express it (keyframes, complex selectors, `@supports` blocks).
- Define all design tokens in `@theme` in `global.css`: colors, font families, type scale, spacing, radii, shadows, easing, durations. Never hardcode hex values or arbitrary values (`text-[17px]`) in markup.
- If a design system is provided, use only its tokens and components. Add no style it does not define.
- Mobile-first: base classes for mobile, then `sm:` `md:` `lg:` `xl:`.
- Use container queries (`@container`) for components that live in variable-width slots.
- Extract repeated class groups into an Astro component, not `@apply`. Use `@apply` sparingly and only in `global.css`.
- No inline `style` attributes, except for CSS custom properties passed from props (e.g. `style={`--delay: ${i * 80}ms`}`).
- No redundant or unused classes.
- Use `clamp()` via theme tokens for fluid typography.

## Images

- Store source images in `src/assets/`, never in `public/` (public skips optimization).
- Use `<Picture>` from `astro:assets` with `formats={['avif', 'webp']}` and a fallback. Use `<Image>` for simple cases where WebP alone is enough.
- Always set `widths` and `sizes` for responsive images so the browser downloads the right size.
- Always provide `alt`. Use `alt=""` for decorative images.
- Always provide intrinsic `width` and `height` (Astro infers them for local images) to prevent layout shift.
- LCP image (usually the hero): `loading="eager"`, `fetchpriority="high"`. Everything else: default lazy loading.
- Quality: 75 to 80 for photos. Max source width around 2400px.
- SVG for logos, icons and illustrations. Inline small icons as Astro components; optimize SVGs (remove metadata, fixed IDs).
- Video: use `<video>` with `muted playsinline`, `preload="none"` or `metadata`, a poster image, and AV1/WebM with MP4 fallback. Never autoplay video above the fold on mobile without a poster.
- Remote images: whitelist domains in `astro.config` `image.domains` so they get optimized too.

## Fonts

- Self-host fonts (WOFF2 only) or use Astro's built-in font handling. No Google Fonts `<link>` at runtime.
- Subset fonts to the needed character sets (Latin, Latin Extended for Romanian diacritics when relevant).
- Preload only the 1 or 2 fonts used above the fold.
- `font-display: swap`, with a size-adjusted fallback font to reduce layout shift.
- Prefer variable fonts when more than 2 weights are used.

## Animation hierarchy

Use the first option that can do the job. Move down only when the one above cannot.

1. **CSS transitions** for state changes: hover, focus, open/close, color, transform, opacity.
2. **CSS keyframes** (`@keyframes` defined in `@theme` or `global.css`) for entrances, loops and sequences. Use custom properties for stagger delays.
3. **Native platform features** as progressive enhancement: `<details>`, `:has()`, `@starting-style`, View Transitions, scroll-driven animations. Always wrap non-baseline features in `@supports` with a working static fallback.
4. **Minimal vanilla JS** only to toggle a class or attribute (e.g. an `IntersectionObserver` that adds `data-visible`). The animation itself stays in CSS.
5. **GSAP** only for complex timelines, scroll-scrubbed sequences, SVG morphing, or physics that CSS cannot do. Import only the plugins needed and load it on the pages that use it.

Rules for all motion:

- Animate only `transform` and `opacity` (plus `filter` sparingly). Never animate `width`, `height`, `top`, `left`, `margin`.
- Every animation must have a purpose: guiding attention, showing state, or showing relationships. No decorative motion.
- Respect `prefers-reduced-motion`: use Tailwind `motion-safe:` / `motion-reduce:` variants, and disable or shorten GSAP timelines with `gsap.matchMedia()`.
- Content must be visible if CSS animations or JS fail. Never ship elements hidden by default that only JS reveals.
- Durations: 150 to 300ms for UI feedback, 400 to 800ms for entrances. Use easing tokens, not `linear` or default `ease`.
- Use `will-change` only temporarily on elements about to animate, never globally.

## JavaScript (last resort)

- Default is zero client JS. Every `<script>` must be justified.
- Prefer HTML and CSS solutions: `<details>`/`<summary>` for accordions, `<dialog>` for modals, `popover` attribute for menus and tooltips (with fallback), CSS `:checked`/`:has()` for simple toggles, anchor links with `scroll-behavior: smooth`.
- When JS is needed, use Astro `<script>` tags (bundled, deduplicated, deferred automatically). Keep scripts small and scoped to the component.
- Use `is:inline` only for tiny critical scripts (e.g. theme detection) that must run before paint.
- If a framework island is required, use the laziest directive that works: `client:visible` > `client:idle` > `client:load`. Never `client:only` unless the component cannot render on the server.
- No jQuery, no utility libraries for things the platform already does.
- Third-party scripts (analytics, chat, tag managers): load deferred, after interaction or idle. Consider Partytown for heavy ones. Ask before adding any.

## Browser support

- Target: last 2 versions of Chrome, Edge, Firefox, Safari, plus iOS Safari and Chrome Android.
- Use only CSS and JS features that are **Baseline Widely Available**. Check MDN or caniuse before using anything newer.
- Features newer than that (scroll-driven animations, cross-document View Transitions, anchor positioning, `field-sizing`, etc.) are allowed only as progressive enhancement inside `@supports`, with a fully functional fallback.
- Never use: vendor-prefixed-only properties, `-webkit-box-reflect`, non-standard scrollbar hacks as the only styling, or features behind flags in any target browser.
- Test layout in Safari specifically (flex/grid gaps, `position: sticky`, `100vh` on iOS). Use `svh`/`dvh` units for full-height sections.

## HTML and accessibility

- Semantic elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`. One `<main>` per page.
- One `<h1>` per page. Never skip heading levels. Style headings by token, not by tag.
- Links go somewhere (`<a>`), buttons do something (`<button>`). Never put click handlers on `<div>`.
- Every interactive element must be keyboard accessible with a visible `:focus-visible` style.
- Add a "Skip to content" link.
- Color contrast WCAG AA minimum (4.5:1 body text, 3:1 large text and UI).
- Touch targets at least 44x44px.
- Form inputs always have a `<label>`. Use correct `type`, `autocomplete` and `inputmode`.
- Use ARIA only when native semantics are not enough.
- Set `lang` on `<html>`.

## SEO and metadata

- `BaseLayout.astro` takes `title`, `description`, `image`, `canonical` props and renders all meta: title, description, canonical, Open Graph, Twitter cards.
- Unique title (under 60 characters) and description (under 160 characters) per page.
- Set `site` in `astro.config` and use `@astrojs/sitemap`.
- Add `robots.txt` in `public/`.
- Add JSON-LD structured data (Organization, WebSite, Article, BreadcrumbList, FAQPage) where relevant.
- Clean, lowercase, hyphenated URLs. Consistent trailing slash setting.
- Custom 404 page.
- For multilingual sites, use Astro i18n routing with `hreflang` tags.

## Performance budget

- Lighthouse: 95+ on Performance, Accessibility, Best Practices, SEO (mobile).
- LCP under 2.0s, CLS under 0.05, INP under 200ms.
- Client JS per page: under 30KB gzipped (excluding GSAP when justified).
- Total CSS: under 30KB gzipped.
- No render-blocking third-party resources.
- Prefetch internal links with Astro `prefetch` (hover or viewport strategy).
- Lazy-load embeds (YouTube, maps) with a static facade that loads the iframe on click.

## Content and copy

- Use realistic copy, never lorem ipsum.
- No em dashes in copy.
- Keep copy in content collections or frontmatter, not scattered through markup, so non-developers can edit it.

## Code style

- No unnecessary comments or blank lines.
- No unused imports, props, components or classes.
- Run `astro check` and fix all errors and warnings before considering a task done.
- Format with Prettier (`prettier-plugin-astro`, `prettier-plugin-tailwindcss` for class sorting).

## Design recreation from a reference

When the user provides a reference image (screenshot) and optionally CSS classes or style notes:

1. **Generate** the page or section in Astro using the project's Tailwind setup and tokens. Build it as a page in `src/pages/` composed of section components, unless the user asks for something else.
2. **Screenshot** the rendered result with the dev server running: `npx playwright screenshot --full-page --viewport-size=1440,900 http://localhost:4321/<route> shot.png` (or Puppeteer equivalent). Match the viewport width to the reference. If the page has distinct sections, capture those individually too.
3. **Compare** the screenshot against the reference. Check for mismatches in:
   - Spacing and padding (measure in px)
   - Font sizes, weights and line heights
   - Colors (exact hex values)
   - Alignment and positioning
   - Border radii, shadows and effects
   - Responsive behavior
   - Image and icon sizing and placement
4. **Fix** every mismatch found in the Astro/Tailwind code.
5. **Re-screenshot** and compare again.
6. **Repeat** steps 3 to 5 until the result is within 2 to 3px of the reference everywhere.

Do not stop after one pass. Always do at least 2 comparison rounds. Only stop when the user says so or when no visible differences remain.

Rules for recreation:

- Do not add features, sections or content not present in the reference.
- Match the reference exactly. Do not "improve" the design.
- If the user provides CSS classes or style tokens, use them verbatim and add them to `@theme` when they are tokens.
- Keep code clean but don't over-abstract during recreation. Inline Tailwind classes are fine; extract components only for clearly repeated blocks.
- When source images aren't provided, use placeholders from `https://placehold.co/` at the exact reference dimensions (add `placehold.co` to `image.domains`). Replace them with real assets in `src/assets/` before launch.
- When reporting comparison results, be specific about what's wrong, e.g. "heading is 32px but reference shows ~24px", "gap between cards is 16px but should be 24px".
- Mobile-first still applies. If only a desktop reference is given, ask whether to infer the mobile layout or wait for a mobile reference.

## Workflow

- When changing existing code, show or edit only the affected sections. Do not restructure layouts without asking.
- Ask one short clarifying question when a request is ambiguous, before building.
- Before finishing a task, verify: builds without errors, no console errors, responsive from 360px to 1920px, keyboard navigation works, reduced motion respected, images output as AVIF/WebP.
