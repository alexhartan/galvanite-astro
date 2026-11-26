# Galvanite Design System

Source of truth for tokens, utilities, primitives and content boundaries. Read this before you add a style, a component or a content field.

## Files

| Layer | Location |
|---|---|
| Tokens and utilities | `src/styles/global.css` |
| UI primitives | `src/components/ui/` |
| Sections | `src/components/sections/` |
| Page copy and section config | `src/data/home.ts` |
| Repeating content | `src/content/*` + `src/content.config.ts` |
| Behavior | `src/scripts/` (shared helpers in `env.ts`) |

## Tokens

### Color

Primitives are the brand palette. Use roles for lines and tints.

| Primitive | Use |
|---|---|
| `space-950`, `space-900`, `space-800` | dark surfaces (gradient `from-space-950 to-space-900`) |
| `abyss` | FAQ gradient, card shadow |
| `ink` | primary text on light |
| `ocean`, `ocean-50` | headings on light, pills |
| `azure-deep` | accent text on light |
| `sky` | accent text on dark, links |
| `glacier`, `glacier-tint` | form hover and checked states, mission reveal leading edge |
| `frost` | text on dark |
| `signal` | primary action, accent bar |
| `alert` | errors |
| `graphite` | body text on light |
| `navy`, `midnight` | only through the roles below |

| Role | Value | Use |
|---|---|---|
| `line` | ink 10% | rules and borders on light |
| `line-dark` | white 10% | rules and borders on dark |
| `line-solid` | opaque ink 10% on white | hover borders that overlap other lines |
| `line-control` | midnight 20% | form field and checkbox borders |
| `tint` | navy 3% | panel gradients (`from-tint to-transparent`) |
| `grid` | white to ink, set by `hero-scene.ts` | grid marks and hero lines |

### Typography

DM Sans variable. Weights: 200, 300, 400, 500, 600.

| Group | Tokens |
|---|---|
| UI | `text-2xs`, `text-xs` (no line-height, inherits), `text-sm`, `text-link-sm`, `text-base` |
| Body | `text-lead`, `text-answer` |
| Titles | `text-benefit`, `text-card` (scales with the case card width, `cqw`), `text-price`, `text-price-lg` |
| Headings | `text-assess`, `text-section`, `text-stat` |
| Statements | `text-statement`, `text-statement-lg`, `text-statement-xl`, `text-intent`, `text-intent-lg`, `text-intent-xl` |
| Display | `text-display`, `text-display-half`, `text-display-hero`, `text-lead-hero`, `text-lead-hero-xl` |

Letter-spacing: `tracking-display` (-0.05em), `tracking-headline` (-0.035em), `tracking-title` (-0.03em), `tracking-snug` (-0.02em).
Line height: `leading-display` (0.9), `leading-heading` (1), `leading-statement` (1.113), `leading-lead-hero` (1.456).

Each `text-*` token carries its own line-height and letter-spacing. Do not add `tracking-*` or `leading-*` to a heading unless the context needs it.

### Spacing and layout

| Token | Use |
|---|---|
| `gutter` (1.5rem) | page gutter: `px-gutter`, `left-gutter`, `right-gutter` |
| `nav` (5.5rem) | header height, scroll offset |
| `lift` | hover lift (`-translate-y-lift`) |
| `pt-section`, `pb-section`, `py-section` | shared section rhythm: 10rem, 14rem at lg |
| `max-w-page`, `max-w-page-inset` | page width (inset leaves room for the section-link rail) |
| `max-w-lead`, `max-w-lead-hero`, `max-w-headline`, `max-w-mission` | text measures |
| `3xl` (100rem), `4xl` (120rem) | ultra-wide breakpoints |

### Large screens

From 1920px (`4xl`) the root font size grows 0.0025px per pixel of viewport, capped at 110% (17.6px at 2560px). Everything in rem (type, spacing, container, nav) scales together. 1px lines and the hero scene do not. Defined in the base layer of `global.css`.

### Radius, shadow, blur

`rounded-control` (checkbox, pills), `rounded-surface` (cards, fields). Buttons are square. `backdrop-blur-bar`. No shadows.

### Motion

| Token / utility | Use |
|---|---|
| `motion-ui` | 300ms, ease-out-soft; default for hover and state changes. Combine with `transition`, `transition-opacity`, `transition-colors` or `transition-transform`. |
| `motion-slow` | 500ms, ease-out-soft; signal bars, rotator, KPI hover |
| `ease-out-soft` | default curve |
| `ease-out-expo` | scroll reveals (`reveal-*` utilities) |
| `ease-in-out-soft` | CTA fill, art hover, featured price card |
| `ease-in-soft` | CaseCard arrow fade-in |
| `duration-200`, `duration-700` | section links; image zoom, canvas fade, carousel |
| `animate-marquee`, `animate-marquee-slow` | logo marquees |
| `animate-marquee-up`, `animate-marquee-down` | slant gallery columns (90s loop) |

Both motion utilities stop transitions when the user prefers reduced motion.

## Utilities

| Utility | Does |
|---|---|
| `focus-ring` | 2px solid outline, 2px offset on `:focus-visible`. Set the color with `focus-visible:outline-*`. |
| `caps` | uppercase + widest tracking. Set the size separately. |
| `report-dialog` | dialog size, backdrop and open/close transition (`@starting-style`, falls back to no animation) |
| `reveal-on-hover` | at lg: hidden until the parent `.group` is hovered or focused |
| `reveal-*` | scroll reveal choreography, driven by `data-reveal-state` |
| `details-expand` | animated `<details>` (progressive enhancement) |
| `clip-left`, `bleed-x`, `mask-fade-x` | layout hacks for marquees and full-bleed backgrounds |

## Primitives

| Component | Props | Use |
|---|---|---|
| `Section` | `id`, `tone`, `labelledby`, `clip`, any section attribute | every section except Hero |
| `SectionFrame` | `inverted`, `edge` (`true`, `false`, `'always'`), `top`, `bottom`, `markRight`, `class` | page rules and grid marks |
| `Container` | `class` | page width and gutter |
| `Eyebrow` | `id`, `inverted`, `class` | section label (aligned to the statement cap height) |
| `SplitHeading` | `as`, `id`, `lead`, `emphasis`, `class`, `leadClass`, `emphasisClass` | heading with a bold second part |
| `CtaButton` | `href`, `variant`, `link`, `class` | primary and secondary actions |
| `Checkbox` | `name`, `value`, `size` (`md`, `sm`) | custom checkbox; place inside a `label.group` |
| `InlineField` | `id`, `name`, `label`, `action`, `type`, `placeholder`, `autocomplete`, `inputmode`, `describedby`, `compact` | input with an attached submit button (website field, report email) |
| `ReportDialog` | `id`, `action` | modal opened by the self-check form on a valid submit; filled by `assess.ts` |
| `GridMark`, `ColumnLines` | | grid decoration |
| `LogoMarquee` | `large`, `class` | client logo marquee |
| `SlantGallery` | `class` (position) | two skewed (-15°) columns of square tiles, marquee up and down, column eases to a stop on hover and ramps back (scripts/gallery.ts), tile lifts 8px with a shadow; bottom and right edges; 9 project images (src/assets/cta) as WebP, counter-skewed upright inside the slanted tiles |
| `CaseCard` | `data`, `index`, `copy`, `class` | case study thumbnail with the hover expansion (see below) |
| `ArrowIcon`, `SparkIcon`, `Logo` | `class` | icons |

## Secondary pages

Template: `src/pages/sandbox.astro` (noindex, out of the sitemap), copy in `src/data/sandbox.ts`.

- `PageHero`: fixed cosmic scene behind a transparent hero (`page-hero`, min 40svh incl. the nav) with breadcrumb, H1 (`SplitHeading`) and lead. It sets the dark scene path so later dark sections (closing CTA) stay dark.
- Then white grid sections: `Intro` (statement), `FeatureGrid` (3-column items with `ColumnLines`), `TextBlock` (label + centered half-width prose, `prose-body`), `ClosingCta`.
- Section rail labels come from the page's own `sections` list, like the homepage.

## Case card

Neutral: photo mask 90% of the card width tall (square at `4xl`) and the title in `ocean` below it. Hover or keyboard focus (`case-open` variant, fine pointers only): the frame grows 5.2% of the card width left and right and down past the title. The photo fills the whole frame and does not scale; neutral shows a crop of it and the mask grows to reveal the rest. A multiply gradient (black 0%, white 25%, white 65%, black 90%) at 50% opacity darkens the top and bottom. The title turns white and lifts. The logo, stats and the 1px white/30 rule fade in.

All sizes are in `cqw` of the card (`case-card` sets `container-type`), so the composition stays the same at every width. Timing: frame, photo and title 800ms `ease-out-expo`; shade 700ms; details 500 to 800ms after a 260ms delay; rule 1000ms `ease-out-soft` from the start of the hover (white 30%); everything closes faster (150 to 200ms). The utilities `case-frame`, `case-photo`, `case-shade`, `case-fade`, `case-reveal`, `case-rule`, `case-title`, `case-logo`, `case-stats` and `case-motion-none` live in `global.css`, because Tailwind cannot express the `cqw` math and the group state in classes.

Content: `logo` (optional, white SVG) and `stats` (rotates when there is more than one) in `src/content/case-studies`.

## Context rules (keep local)

These values stay in their component. Do not make global tokens from them.

- Container-query type sizes (`cqi`) and `3xl:` / `4xl:` overrides: tuned to each composition.
- Section padding other than `*-section`: each section has its own rhythm. FeaturedWork padding also absorbs parallax travel.
- Eyebrow cap offsets and the featured price baseline: optical math tied to specific type sizes.
- Parallax rates: set per element with `data-parallax="0.25"` (and `data-parallax-from="enter"`). Used on Intro, FeaturedWork and ClosingCta; Pricing has none.
- SectionLink positions: measured at runtime.
- Layering: sections `z-10` (they scroll over the fixed hero), section links `z-20`, header and skip link `z-30`.
- Art SVG geometry (`art/kit.ts`): illustration coordinates in px.
- Pricing tier visuals: mapped from the `tier` enum inside `Pricing.astro`.

## Content boundaries

| Belongs in | What | Never |
|---|---|---|
| Tokens / CSS | color, type, spacing, radius, motion | copy |
| Component props | content values and closed layout variants (`tone`, `variant`, `edge`) | class names from content |
| Content (`src/data`, `src/content`) | copy, images with alt, links, order, visibility, closed choices (`tier`, `art`) | classes, colors, sizes, parallax rates, tone |

Section labels for eyebrows and the section-link rail come from one list: `sections` in `src/data/home.ts`.

## Reuse on a new project

1. Copy `global.css`. Replace the color primitives, font and type values. Keep roles, utilities and motion.
2. Copy `components/ui` and `scripts/env.ts`.
3. Write new sections from the primitives. Put copy in `src/data` and repeating content in collections.
