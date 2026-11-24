# Design System Audit: Phase 1

Status: Phase 2 done. See `docs/design-system.md` for the system as built.

Scope: `src/styles/global.css`, 11 sections, 21 UI and art components, 12 scripts, 7 content collections, `index`, `lab` and `404` pages.

## Important finding: there is no Sanity

This repo does not use Sanity. All content comes from Astro content collections (`src/content/*.md` + Zod schemas in `src/content.config.ts`). Page copy for hero, mission, results, closing, why and self-check is in the frontmatter of `src/pages/index.astro`.

For this audit, the content collections are the content layer. Section 4 shows the 1:1 map to Sanity schemas, so a migration later is direct.

---

## 1. Redundancy and cleanup audit

### 1.1 Dead code (safe to delete, no visual change)

| Item | Location | Evidence |
|---|---|---|
| `--color-deep-950` | global.css | 0 uses |
| `--spacing-display-baseline` | global.css | 0 uses |
| `@utility bleed-y`, `@utility bleed-r` | global.css | 0 uses |
| `--text-mission--line-height`, `--text-mission-xl--line-height` | global.css | Every use also has `leading-none`, which overrides them |
| `--text-price-lg--letter-spacing` | global.css | The element also has `tracking-price`, which overrides it |
| `client` field on `caseStudies` | content.config.ts | Never read by a component |
| Markdown bodies of all collections except `faqs` | src/content | Empty, never rendered |

### 1.2 Duplicate tokens (merge)

| Tokens | Values | Proposal |
|---|---|---|
| `azure` / `frost` | `#cceaff` / `#ccecff` | One token, `frost` (`#ccecff`). Change is less than 1% lightness, not visible. |
| `text-xs` (overridden) / `text-tag` | 0.65rem / 0.65625rem | One token, `text-2xs: 0.65625rem`. Restore Tailwind's default `text-xs` (0.75rem). |
| `text-label` / Tailwind `text-xs` | 0.75rem / 0.75rem | Delete `text-label` and use `text-xs` (after restoring it). |
| `text-nav-label` / Tailwind `text-sm` | 0.875rem / 0.875rem | Delete it and use `text-sm`. |
| `text-stat-label` | 1rem, lh 1.25 | Equals `text-base leading-tight`. Delete. |
| `tracking-price` / `--text-card--letter-spacing` | -0.03em / -0.03em | One token, `--tracking-title`. |
| Letter-spacing -0.033em (section, assess) / -0.035em (statement, intent) | difference of 0.1px at 58px | One token, `--tracking-headline: -0.035em`. |

### 1.3 Duplicate markup patterns (extract)

| Pattern | Repeated in | Proposal |
|---|---|---|
| Section shell: `section id aria-labelledby data-tone scroll-mt-nav relative z-10 overflow-x-clip bg-white` + inner `data-guide border-t` | 8 sections | `Section.astro` with props `id`, `tone: 'light' \| 'dark'`, `frame` options. Tone sets the background, line color and `data-tone` together. |
| Hand-built left page rule (`Container absolute inset-0` + `bg-ink/10 left-6 w-px`) | Results, WhyGalvanite, SelfCheck, Hero | Use `SectionFrame`. Add `edge="always"` (SelfCheck shows the right rule at all widths) and `top={false}`. |
| Hover panel: navy/3 gradient + `border-rule` outline + signal bar `h-1 mix-blend-multiply translate-y-full` | WhyGalvanite cards, Results stats | `HoverPanel.astro` (decorative layers only, `aria-hidden`). |
| Lead + bold emphasis heading | Hero, Results, Pricing, ClosingCta | `SplitHeading.astro` with props `lead`, `emphasis`, `block`. |
| Overline text (`font-semibold tracking-widest uppercase` + small size) | Eyebrow, Hero eyebrow, Hero "Trusted by", Pricing "Most popular", Pricing duration, Testimonials name/role, CaseCard scope pills | `@utility overline` (tracking + uppercase). Size is a separate class (`text-2xs`, `text-xs`, `text-sm`). |
| `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-*` | 15+ elements | `@utility focus-ring` (color from `currentColor`, override with `outline-*`). |
| `ease-out-soft transition duration-300` | 30+ elements; plus 3 local `motion` constants (Results, CtaButton, art/kit.ts) | `@utility motion-ui` (300ms + ease-out-soft + reduced-motion off). Combine with `transition-opacity` and others as before. |
| Show on hover at lg: `lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100` + transition | Pricing secondary CTA, Testimonials CTA | `@utility reveal-on-hover`. |
| `initParallax` with selectors fixed to `#contact`, `#intro`, `#engagements` | 4 sections | One script in BaseLayout reads `data-parallax="0.25"`. Also fixes a bug: if the `id` prop changes, parallax stops. |
| GridMark offset `translate-x-1.25` / `translate-y-1.25` | SectionFrame, SelfCheck | GridMark prop `align: 'left' \| 'right'`, `edge: 'top' \| 'bottom'`. The 1.25 offset stays inside GridMark (half of its 11px size). |

### 1.4 Duplicate data and logic

| Item | Problem | Proposal |
|---|---|---|
| `sections` array in index.astro | Labels repeat each section's `label` prop with different case ("Our Mission" / "Our mission", "Featured Work" / "Featured work"). `dark` repeats the section's tone. | One section config per section: `id`, `label`, `tone`. SectionLink and the section both read it. |
| Pricing `tiers` map | `standard` and `premium` are equal except `mark`. `term` is the same in all three. | Base tier style + featured override + `mark` color only. |
| LogoMarquee | `height={large ? 90 : 80}` and `class={large ? 'h-22.5' : 'h-20'}` repeat one value | One size map: `{ height, class }`. |
| `lab.astro` | Copies hero and mission copy, and the copy is out of date | Import the same content as index. |
| `matchMedia('(prefers-reduced-motion: reduce)')` and rAF scroll throttling | Repeated in parallax, nav-tone, SectionLink, image-reveal, autoplay, hero-scene | `scripts/env.ts` with `reducedMotion()` and `onScrollFrame(fn)`. Less JS, same behavior. |

### 1.5 Bugs and rule conflicts found (fix in Phase 2)

| Item | Location | Note |
|---|---|---|
| Heading level skip | FeaturedWork: Eyebrow `h2` → CaseCard `h4` | Change CaseCard title to `h3`. |
| CTA links to its own section | ClosingCta `ctaHref = '#contact'`, and the section id is `contact` | Needs a real booking URL. Question for you. |
| `ease-standard` = CSS `ease` | CtaButton, art/kit.ts, Pricing featured | CLAUDE.md does not allow default `ease`. Proposal: change to `ease-in-out-soft`. Small visual change on hover only. |
| `italic` on self-check statements | SelfCheck | Not a headline, so your "no italic accents" rule may not apply. Confirm: keep or remove. |
| Placeholder testimonials | `jordan-lee.md` and others use placeholder copy and photo | Content task, not code. |
| Results stat links are `#` | index.astro | Content task. |

### 1.6 Keep, but mark as tooling

`lab.astro`, `CameraLab.astro`, `hero-camera.json` and `.github/workflows/camera-default.yml` are an internal tool for the hero animation. They are not part of the design system. CameraLab uses arbitrary values (`max-h-[calc(100svh-2rem)]`, `grid-cols-[4rem_1fr_3rem]`, `rounded-xl`, `backdrop-blur-md`). Keep them local to the lab. Do not make tokens for them.

---

## 2. Design token draft

Two layers in `global.css`:

1. **Primitives**: the raw brand palette and scales (what the brand is).
2. **Roles**: semantic aliases (where a value is used). Components use roles first. Future projects change primitives and keep roles.

### 2.1 Color

Primitives (after cleanup):

| Token | Value | Uses now |
|---|---|---|
| `space-950` | `#070a16` | dark surface start, hero, header |
| `space-900` | `#141a3c` | dark surface end, CTA hover fill |
| `space-800` | `#1f3166` | 404 gradient only |
| `abyss` | `#04091b` | FAQ gradient, card shadow |
| `navy` | `#000f40` | only as a 3% tint |
| `midnight` | `#1b2540` | only as a 15% form border |
| `ink` | `#1d3961` | primary text on light, lines |
| `ocean` | `#305785` | headings on light |
| `ocean-50` | `#ecf2f9` | pills, featured price gradient |
| `azure-deep` | `#2e6aa3` | accent text on light |
| `sky` | `#76b1db` | accent text on dark, links |
| `glacier` | `#92c9eb` | form hover and checked border |
| `frost` | `#ccecff` | text on dark (merged with `azure`) |
| `signal` | `#ffd23f` | primary action, accent bar |
| `alert` | `#d6455e` | form errors |
| `graphite` | `#1f2937` | body text on light |

Roles (new):

| Role | Maps to | Replaces |
|---|---|---|
| `--color-surface` | white | `bg-white` on 6 sections |
| `--color-surface-dark` | `space-950` → `space-900` gradient | Hero, header, 404 |
| `--color-text` | `ink` | `text-ink` |
| `--color-text-muted` | `graphite` | `text-graphite` |
| `--color-text-on-dark` | `frost` | `text-frost` |
| `--color-accent` | `azure-deep` (light) / `sky` (dark) | |
| `--color-line` | `ink` at 10% | `border-ink/10`, `bg-ink/10` (15×) |
| `--color-line-dark` | white at 10% | `border-white/10` (11×) |
| `--color-line-solid` | existing `rule` (opaque ink 10% on white) | used where hover borders overlap |
| `--color-line-control` | `midnight` at 15% | form field borders |
| `--color-tint` | `navy` at 3% | panel gradients (3×) |
| `--color-action` / `--color-action-fill` | `signal` / `space-900` | CtaButton primary |
| `--color-grid` | unchanged (JS-driven, see 3.6) | |

### 2.2 Typography

Font: DM Sans variable, weights 200, 300, 400, 500, 600 only. No change.

| New token | Old token(s) | Value | Uses |
|---|---|---|---|
| `text-2xs` | `text-xs` override + `text-tag` | 0.65625rem | hero overlines, pills, roles |
| `text-xs` (default) | `text-label` | 0.75rem | eyebrows, "Most popular" |
| `text-sm` (default) | `text-nav-label` | 0.875rem | section links, UI text |
| `text-link-sm` | unchanged | 0.8125rem | stat links |
| `text-lead` | unchanged | clamp(1.125rem, 1.25vw, 1.5rem) | body intro |
| `text-question` | unchanged | 1.375rem | FAQ |
| `text-benefit` | unchanged | clamp(1.2rem, 1.25vw, 1.55rem) | benefit titles |
| `text-card` | unchanged | clamp(1.625rem, 2.08vw, 2.1125rem) | case titles |
| `text-price` / `text-price-lg` | unchanged | clamp | pricing |
| `text-assess` | unchanged | clamp(1.875rem, 2.5vw, 3rem) | self-check heading |
| `text-section` | unchanged | clamp(2.1875rem, 3vw, 3.625rem) | standard H2 |
| `text-stat` | unchanged | clamp(2.9rem, 3.6vw, 4.2rem) | KPI values |
| `text-statement` | unchanged | clamp(2rem, 3.23vw, 3.875rem) | mission, closing (mobile) |
| `text-statement-lg` | `text-mission` | 75cqi / 14.3882 | mission, closing (lg) |
| `text-statement-xl` | `text-mission-xl` | 84cqi / 14.3882 | mission (4xl) |
| `text-intent`, `-lg`, `-xl` | unchanged values, written as `statement × 0.95` where the ratio holds | | "Built with intent" |
| `text-display`, `-half`, `-hero` | unchanged | clamp / cqi | hero H1 |
| `text-lead-hero`, `-xl` | unchanged | derived from display-half | hero lead |

Letter-spacing (referenced by the `--text-*--letter-spacing` sub-properties):

| Token | Value | Used by |
|---|---|---|
| `--tracking-display` | -0.04em | display, statement-lg/xl, intent-lg/xl, stat |
| `--tracking-headline` | -0.035em | statement, intent, section, assess |
| `--tracking-title` | -0.03em | card, price |
| `--tracking-snug` | -0.02em | benefit |

Line height (referenced by sub-properties):

| Token | Value | Used by |
|---|---|---|
| `--leading-display` | 0.9 | display family |
| `--leading-heading` | 1 | section, assess, stat, price |
| `--leading-statement` | 1.113 | statement (also sets Eyebrow alignment, see 3.4) |
| `--leading-card` | 1.25 | card |
| `--leading-lead` | 1.42 / 1.456 | lead / lead-hero |

### 2.3 Spacing and layout

| Token | Value | Replaces |
|---|---|---|
| `--spacing-gutter` | 1.5rem | `px-6`, `left-6`, `right-6`, `inset-x-6` (25+ uses) |
| `--spacing-nav` | 5.5rem | unchanged |
| `--spacing-lift` | 0.175rem | unchanged (hover lift) |
| `pt-section` / `pb-section` (utility) | 10rem, 14rem at lg | `pt-40 lg:pt-56`, `pb-40 lg:pb-56` (WhyGalvanite, Testimonials, Faq) |
| `--container-page` | 83rem | unchanged |
| `--container-page-inset` | min(83rem, 100% − 8.5rem) | unchanged (see 3.7) |
| `--container-lead`, `-lead-hero`, `-headline`, `-mission` | unchanged | measure widths |
| `--breakpoint-3xl`, `-4xl` | 100rem, 120rem | unchanged |

Optional 1px snaps ("slightly cleaner"). I recommend these, but they are your decision:

| Now | Proposal | Difference |
|---|---|---|
| Hero logo bar `pt-3.75` | `pt-4` | +1px |
| CaseCard pills `gap-2.25` | `gap-2` | −1px |
| `pb-35` (Pricing) | `pb-36` | +4px |

All other fractional values stay. They are optical alignment (GridMark offsets, header `pt-5.5`, icon sizes).

### 2.4 Radii, shadow, blur

| Role | Maps to | Uses |
|---|---|---|
| `--radius-control` | `--radius-sm` (4px) | checkbox, scope pills |
| `--radius-surface` | `--radius-lg` (8px) | FAQ card, form fields, logo focus ring |
| `--shadow-card` | unchanged | FAQ hover |
| `--blur-bar` | unchanged (10px) | hero logo bar, FAQ card |

Buttons stay square. No pill shapes.

### 2.5 Motion

| Token / utility | Value | Uses |
|---|---|---|
| `--ease-out-soft` | cubic-bezier(0.22, 1, 0.36, 1) | default for all UI |
| `--ease-out-expo` | cubic-bezier(0.16, 1, 0.3, 1) | scroll reveals |
| `--ease-in-out-soft` | cubic-bezier(0.65, 0, 0.35, 1) | art blink; proposed replacement for `ease-standard` |
| `--ease-in-soft` | cubic-bezier(0.32, 0, 0.67, 0) | CaseCard arrow fade-in |
| `--ease-standard` | `ease` | delete after the change above |
| `motion-ui` utility | 300ms + ease-out-soft | 30+ hover and state transitions |
| `motion-slow` utility | 500ms + ease-out-soft | rotator, Results, signal bars |
| Durations kept as classes | `duration-200` (section links), `duration-700` (image zoom, canvas fade, carousel) | Tailwind v4 has no duration theme namespace, so the utilities hold the shared values |
| `--stagger` | 150ms | Results (150ms) and CaseCard (160ms → 150ms, not visible) |
| `--animate-marquee`, `-slow` | 120s, 168s | unchanged |

---

## 3. Context-dependent rules (stay local)

These values look like token candidates but must stay where they are. Each one depends on a specific context.

| Rule | Where | Why it stays local |
|---|---|---|
| 3.1 Container-query type sizes (`cqi`) | display-half, display-hero, statement-lg/xl, intent-lg/xl, slide widths | Tied to the width of their own container to hold line breaks. A global value breaks the composition. Tokens keep the formula; components keep the `@container`. |
| 3.2 `3xl:` and `4xl:` overrides | Hero type, Intro, WhyGalvanite, Results `4xl:pt-24`, CaseCard `4xl:aspect-square`, FeaturedWork | Ultra-wide composition tuning per section. |
| 3.3 Section padding that is not `section` rhythm | Intro `py-48 lg:py-80`, ClosingCta `py-40 lg:py-60`, Pricing `pt-40 lg:pt-60 pb-35 lg:pb-48`, Results `pt-36 lg:pt-56 pb-24 lg:pb-32`, SelfCheck `pt-20 lg:pt-28 pb-30 lg:pb-42`, FeaturedWork `pb-72 lg:pb-112` | Each section has its own rhythm. FeaturedWork and Pricing padding compensates for parallax travel. Only the 3 sections with the same rhythm get `pt-section` / `pb-section`. |
| 3.4 Eyebrow cap offsets (`--spacing-cap-statement`, `--spacing-cap-label`) | Eyebrow | Em-based optical offsets that align the eyebrow's cap height with the first line of the statement next to it. Depend on the statement font size and its 1.113 line height. |
| 3.5 Price baseline math (`--spacing-price-featured`) | Pricing | Aligns the featured (larger) price baseline with the standard prices. Derived from two type sizes. |
| 3.6 `--color-grid` / `--grid-invert` | hero-scene.ts sets it on scroll | Grid lines fade from white to ink as the hero ends. Value is JS-driven, not static. |
| 3.7 `--container-page-inset` | Container | Leaves room for the left section-link rail from lg to 3xl. Layout behavior, not a generic width. |
| 3.8 SectionLink positions (`--top`, `--lead`, `--height`, `--offset`, `--slot`) | SectionLink | Measured at runtime from the eyebrow positions. |
| 3.9 Parallax rates (0.25, 0.2, 0.125) | Intro, ClosingCta, FeaturedWork, Pricing | Depth per section. Proposal moves them to a `data-parallax` value on the element, not to global tokens. |
| 3.10 Hero `fixed` + `h-svh` spacer, sections `z-10` | Hero, all sections | Sections scroll over the fixed hero. Layering: `z-10` sections, `z-20` section links, `z-30` header, skip link and lab. Document; no tokens needed. |
| 3.11 Art SVG geometry | art/*.astro, kit.ts | Internal 300×180 coordinate system in px. Illustration data, not layout. |
| 3.12 Pricing tier visuals | Pricing | Featured scale origin `50% 46%`, `w-triple` guide line, subgrid rows. Specific to this layout. |
| 3.13 Bleed hacks (`clip-left`, `bleed-x`, `-right-page-bleed`) | Hero, FeaturedWork, Results | Let backgrounds and marquees reach the viewport edge outside the container. |
| 3.14 Tone per section | `data-tone` | Set by section type (in `Section.astro`), never by content. nav-tone.ts reads it. |
| 3.15 Reveal choreography (0.6s to 1.8s, 2200ms done timer) | reveal-* utilities, image-reveal.ts | Timed as one sequence. They use the ease tokens, but the durations stay together in the utilities. |

---

## 4. Astro + content architecture map

### 4.1 Layers

```
Tokens        global.css @theme       primitives → roles (color, type, spacing, radius, motion)
Utilities     global.css @utility     motion-ui, focus-ring, overline, pt/pb-section, reveal-*, details-expand
UI primitives components/ui           Container, Section, SectionFrame, GridMark, ColumnLines, Eyebrow,
                                      SplitHeading, CtaButton, HoverPanel, icons, LogoMarquee, CaseCard
Sections      components/sections     Hero, Intro, FeaturedWork, Results, Pricing, Testimonials,
                                      WhyGalvanite, SelfCheck, Faq, ClosingCta, SiteHeader
Page          pages/index.astro       composes sections from one ordered section config
Content       content collections     words, images, links, order, closed-set choices
              (later: Sanity)
Behavior      scripts/                small vanilla modules, one shared env.ts helper
```

### 4.2 Boundary rules

| Belongs in | What | Never |
|---|---|---|
| Tokens / CSS | Color, type scale, spacing, radii, motion, breakpoints | Copy, content order |
| Astro props | Content values (strings, images, links) and closed layout variants (`tone`, `variant`, `edge`, `large`) | Raw classes from content, hex values |
| Astro slots | Free markup inside a primitive (CTA label, heading content) | |
| Content (collections / Sanity) | Copy, images + alt, links/references, order, visibility, closed-set choices (`tier`, `art`, `featured`) | Class names, colors, sizes, spacing, parallax rates, tone |
| Scripts | Runtime state only (`data-*` attributes, CSS custom properties) | Animations themselves (CSS does those) |

The current content schemas already follow this rule well. `tier` and `art` are closed enums, and the component maps them to visuals. That pattern stays.

### 4.3 Content model: collections now, Sanity later

| Collection now | Sanity schema | Changes for Sanity |
|---|---|---|
| index.astro frontmatter (hero, mission, results, closing, why, check) | `homePage` singleton with `sections[]` page builder | Each block type = one section component. Mission `statement` segments become Portable Text with a `strong` mark. Results stat `href` becomes a reference to `caseStudy`. |
| `sections` array (nav labels) | `anchor` + `navLabel` fields on each block | Removes the duplicate labels. |
| `caseStudies` | `caseStudy` document | `client` becomes a reference to `client`. `image` + `imageAlt` become one image field with hotspot and an `alt` subfield. `href` becomes a slug or reference. |
| `benefits` | `benefit` document | `art` stays a string list (closed set). |
| `engagements` | `engagement` document | `tier` stays a closed list. |
| `checks` | `assessmentItem` document | none |
| `faqs` | `faq` document | Markdown body becomes Portable Text `answer`. |
| `testimonials` | `testimonial` document | `caseStudyHref` becomes a reference to `caseStudy`. |
| `clients` | `client` document | `hidden` becomes `showInMarquee`. |
| CTA hrefs (`#contact` defaults) | `siteSettings` singleton | One booking URL for header, pricing and closing CTAs. |
| `order` fields | array order in the page builder, or an orderable-list plugin | |

Data flow with Sanity: one GROQ query per page. The projection returns the exact shape of each section's `Props` (types from Sanity TypeGen). A `SectionRenderer.astro` maps block `_type` to the section component. Portable Text renders with a small serializer (`strong` → `font-medium`, links → `prose-links`). The site stays static: content is fetched at build time and a Sanity webhook starts the Pages build.

### 4.4 Reuse on future projects

Copy `global.css` (replace primitives, keep roles and utilities), `components/ui`, `scripts/env.ts` and the content schemas. Sections are the project-specific layer.

---

## 5. Phase 2 plan (after sign-off)

Each step is one commit. After each step: `astro check`, build, and screenshot compare at 390, 1440 and 1920px against the current site.

1. Delete dead code (1.1). No visual change.
2. Merge duplicate tokens (1.2) and add the primitive/role layers (2.1 to 2.5).
3. Add utilities: `motion-ui`, `motion-slow`, `focus-ring`, `overline`, `reveal-on-hover`, `pt-section`, `pb-section`.
4. Extract primitives: `Section`, `SplitHeading`, `HoverPanel`; extend `SectionFrame` and `GridMark`.
5. Shared section config; SectionLink reads it; one parallax init.
6. Scripts: `env.ts` helper.
7. Fixes from 1.5 that you approve.
8. Document the system in `docs/design-system.md` (tokens, primitives, boundary rules) for future projects.

## 6. Decisions needed

1. Sanity: keep content collections and make the schemas Sanity-ready (recommended for Phase 2), or migrate to Sanity in Phase 2?
2. Optional 1px snaps in 2.3: apply or skip?
3. `ease-standard` → `ease-in-out-soft`: apply or skip?
4. Self-check statements: keep `italic` or remove?
5. Booking URL for the CTAs (now `#contact`).
