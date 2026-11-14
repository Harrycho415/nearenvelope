# NEAR Envelope Design System — "Paper & Post"

> Global source of truth for the frontend look. Page files under `pages/` override this when they exist.
> Derived from a visual study of marijanapav.com/stamps (look and measurements only — that repo has no
> license, so no code or assets are copied) and filtered through ui-ux-pro-max (styles `e-ink-paper` +
> `skeuomorphism`, typography "Minimalist Monochrome Editorial", UX/motion rules).
> Implementation: tokens live in `frontend/src/app/globals.css` (`@theme`), never as hex in components.

## 1. Concept

An envelope is a physical keepsake, so the interface is a **desk with paper on it**: a warm off-white
page, serif copy set like a letter, monospace labels like a postmark, and every envelope shown as a
**perforated postage stamp** that can be picked up, tilted and passed on.

Three rules decide everything else:

1. **Paper, not panels.** Surfaces are sheets: hairline borders, 2–3px corners, soft paper shadows. No
   glass, no glow, no gradients, no pill cards.
2. **One hot ink.** Vermilion is the only saturated colour and it marks exactly one thing per view (the
   primary action or the seal). Rarity uses the four muted index-tab colours.
3. **Things land, they don't fade.** Motion is the physics of paper: a short rise, a press, a stamp
   thunk. Everything eases out on one curve.

## 2. Colour tokens

| Token | Value | Use |
|---|---|---|
| `canvas` | `#f5f5f4` | page background (desk) |
| `surface` | `#fafaf9` | sheets, cards, inputs |
| `paper` | `#fdfcfa` | raised sheet, selected stamp |
| `line` | `#d6d3d1` | hairline borders, rules, grid |
| `sketch` | `#a8a29e` | hover/strong border, dashed dividers |
| `seal` | `#e7e5e4` | quiet fill: table heads, notes, punch holes |
| `ink` | `#292524` | text, headings |
| `ink-muted` | `#57534e` | secondary text (7.3:1 on canvas) |
| `ink-faint` | `#635d58` | captions, placeholders (5.2:1 on `seal`) |
| `brand` | `#b02d12` | vermilion ink: primary button, links, active (6.0:1) |
| `brand-hover` | `#8f240e` | pressed/hover |
| `on-brand` | `#fffaf5` | text on vermilion |
| `stamp` | `#f44e22` | decorative only: seal wax, postmark ring |
| `ok` | `#3f6b2c` | success text |
| `danger` | `#b3261e` | error text |

Rarity = index-tab families (`text-*` passes 4.5:1 on canvas, `*-tint` is the fill):

| Rarity | text token | tint token |
|---|---|---|
| Common (`Basic`) | `common` `#57534e` | `common-tint` `#e7e5e4` |
| Rare | `rare` `#2b5878` | `rare-tint` `#c3deee` |
| Epic | `epic` `#7f3b63` | `epic-tint` `#e5d2dd` |
| Legendary | `legendary` `#7a4e06` | `legendary-tint` `#f6deb6` |

Light scheme only. Selection: `seal` background, `ink` text.

## 3. Typography

| Role | Face | Spec |
|---|---|---|
| Display / body | **Libertinus Serif** (400, 600, italic) | body 17/27, tracking -0.01em |
| Label / data | **IBM Plex Mono** (400, 500) | 11–12px, uppercase, tracking 0.14em |

- H1 `clamp(2.5rem, 5vw, 4.25rem)` / 1.05, weight 400, tracking -0.02em. H2 28–36px, weight 400. H3 22px, weight 600.
- Headings are never bold; emphasis comes from size and italics. No UI sans anywhere.
- Mono is for things a machine would print: step numbers, rarity, dates, account ids, amounts' units,
  breadcrumbs, button text. Numerals in tables use `tabular-nums`.
- Line length 45–70ch for prose. `text-wrap: balance` on headings.

## 4. Space, shape, depth

- Spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 112. Sections separated by 72–112.
- Radius: `2px` controls, `3px` sheets. Only punch holes, seals and status dots are round.
- Borders: 1px `line`. Dashed 1px `sketch` for dividers inside a sheet and for empty/placeholder states.
- Shadows (paper only):
  - `shadow-sheet`: `0 1px 1px rgb(41 37 36/.04), 0 2px 4px rgb(41 37 36/.05)`
  - `shadow-lift`: `0 2px 2px rgb(41 37 36/.05), 0 10px 24px -6px rgb(41 37 36/.18)`
  - stamps use `filter: drop-shadow` so the shadow follows the perforation.
- Layout: max width 1240, 24px gutters (64px ≥ sm). Editorial two-column split with a vertical hairline
  on wide screens; text column left, object (stamps, sheet) right. Left-aligned by default — centre only
  ceremony moments (open, sent, enhance result).

## 5. Texture

- **Grain**: fixed full-page overlay, SVG `feTurbulence` (fractalNoise 0.8, 4 octaves) at 22% opacity,
  `mix-blend-mode: multiply`, `pointer-events: none`.
- **Graph paper**: `.sheet-grid` — 16px grid in `line` at 45% on `surface`; used for the stamp board
  and ceremony stages only.
- **Punch holes**: `.punched` — a column of 12×20 ovals in `seal` with an inset shadow down the left
  edge of a sheet.

## 6. Components

| Component | Spec |
|---|---|
| **Sheet** (`.sheet`) | `surface`, 1px `line`, radius 3, `shadow-sheet`. Padding 24 / 32. |
| **Note** (`.note`) | `seal` at 55%, dashed `sketch` border, no shadow. Explanatory asides. Inside a sheet it flattens to a dashed top rule — never a box in a box. |
| **Stamp** (envelope art) | 340×230 SVG, perforated edge, rarity-tinted band, design-coloured field, line-drawn envelope, vermilion seal. Rests rotated −3…3°, straightens and lifts on hover. |
| **Primary button** (`.btn-primary`) | vermilion fill, mono 12px uppercase, radius 2, 44px min height, hard 2px offset shadow in `brand-hover`; press moves it 2px down-right onto its shadow. One per view. |
| **Secondary button** (`.btn-secondary`) | `surface` fill, 1px `ink` border, same type; hover fills `seal`. |
| **Text link** (`.link`) | vermilion, underline offset 3px, 1px → 2px on hover. |
| **Label** (`.label`) | mono 11px uppercase tracking 0.14em `ink-faint`. |
| **Index tab** (`.tab`) | mono label on a tinted tab, dashed border; selected = solid border, `paper` fill, raised 2px, overlaps the sheet below. |
| **Field** (`.field`) | `paper` fill, 1px `line`, radius 2; focus = 1px `ink` border + dashed outline. Label above, error below in `danger`. |
| **Ledger rows** (`.ledger`) | label left (mono), value right (serif), dashed divider between rows. |
| **Postmark** (`.postmark`) | circular dashed ring with mono text, rotated −8°; used for status ("OPENED", "SENT", "LEVEL UP"). |
| **Skeleton** | `seal` block, radius 3, slow opacity pulse; no shimmer gradients. |

Icons: none are needed; where one is, a 1.5px stroke SVG — never emoji. Arrows are typographic (`→`, `↗`).

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | everything by default |
| `--ease-bounce` | `cubic-bezier(0.22, 1.35, 0.36, 1)` | stamps settling, press release |
| `--ease-spring` | `linear(0, .32 8%, .78 18%, 1.06 30%, 1.1 38%, 1.02 52%, .99 66%, 1)` | placement, postmark thunk |
| `--dur-exit` | 160ms | leaving, press |
| `--dur-fast` | 200ms | hover, focus, tab change |
| `--dur-slide` | 450ms | entrances |
| `--dur-place` | 900ms | stamps landing, ceremony beats |
| stagger | 40ms (lists), 150ms (paragraphs) | via `--i` |

Patterns:

- **Rise** (`.rise`): opacity 0→1, translateY 8px→0, scale .97→1, `dur-slide`, staggered with `--i`.
- **Ink in** (`InkTitle`): H1 letters appear one by one, 28ms apart, on the hero only.
- **Stamp hover**: un-rotate, translateY −4px, shadow deepens, 200ms; always reverses.
- **Focus pull**: in a stamp grid, hovering/focusing one dims the others to 55% (no layout change).
- **Stamp board** (home): stamps land scattered with the spring; drag to move (pointer capture, settles
  with `ease-bounce`); `Organize` / `Shuffle` buttons give the same result without dragging (WCAG 2.5.7).
- **Tilt** (`Tilt`): pointer-following 3D tilt ≤ 8°, perspective 1200; a diagonal sheen whose strength
  grows with level/rarity. Detail hero, enhance and every step of the send flow.
- **Open ceremony**: flap lifts (rotateX), letter slides up, postmark thunks. 2.2s total.
- **Enhance result**: success = `LEVEL UP` postmark thunk + stamp settle; failure = two short shakes.
- **Typewriter** (`.typed`): ledger values reveal with `steps()`, 25ms per character.

Rules: animate `transform`/`opacity`/`filter` only; at most two moving things per view; exits faster
than entrances; under `prefers-reduced-motion: reduce` every animation and transition collapses to an
instant state change and drag/tilt are disabled.

## 8. Page patterns

| Screen | Pattern |
|---|---|
| Home | Split hero: letter-like copy left, stamp board on a punched graph sheet right. Then recently received (stamp rows), four numbered steps as a ledger, features as an asymmetric two-column list — no card grid. |
| My Envelopes | Heading + actions, index tabs (Owned / Received / Created) sitting on a sheet of stamps with focus pull. |
| Envelope detail | Stamp (tilt) beside title and ledger; index tabs for Overview / Assets / History; history as a dashed timeline. |
| Send flow | Mono step rail (01–04), form sheet left, stamp preview right. |
| Open | Centred ceremony on graph paper. |
| Enhance | Centred stamp with tilt + sheen, ledger of odds and attempts, postmark result. |
| Missions | Envelope picker as stamp rows, missions as sheets with a thin ink progress rule. |
| Wallet | Ledger of balances, test-funds rows with dashed dividers. |

## 9. Accessibility & quality gates

- Text contrast ≥ 4.5:1 (all text tokens above are checked against `canvas`); `stamp` is never text.
- Focus: `outline: 1px dashed ink`, offset 3px, on every interactive element.
- Touch targets ≥ 44px tall; buttons and links have `cursor: pointer`.
- Dragging always has a button alternative; nothing depends on hover.
- Rarity is always written as a word, never colour alone.
- Check at 375 / 768 / 1024 / 1440; no horizontal scroll; the split layout stacks below `lg`.

## 10. Anti-patterns

Eyebrow/kicker labels above a heading, cards nested in cards, headings that skip a level,
Dark mode, neon/lime glow, glassmorphism and backdrop blur, gradient fills, pill-shaped cards
(`rounded-3xl`, `rounded-full` containers), bold sans headings, centred three-card feature grids,
emoji icons, more than one vermilion element competing in a view, shimmer skeletons, bounce on text,
animation of width/height/top/left.
