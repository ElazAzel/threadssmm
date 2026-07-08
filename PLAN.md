# Open Design Integration Plan — Threads SMM Agent

## Objective
Replace the current hand-rolled CSS (`src/styles.css`) and minimal component library (`src/components/ui.tsx`) with a polished, accessible design language drawn from Open Design resources, while preserving all existing functionality.

## Decisions

| Decision | Choice |
|----------|--------|
| Design system hybrid | Supabase surfaces + Vercel typography scale + Dashboard radius + current blue accent |
| Accent color | Keep current blue `#93bfff`/`#1f98ff` (anti-slop compliant) |
| Font | Keep Inter — apply craft tracking rules |
| Component files | Separated into `src/components/ui/*.tsx` |
| Execution | All phases at once |

## File Structure Changes

```
src/
  styles.css                   ← REWRITE: design tokens + semantic classes
  components/
    ui.tsx                     ← DELETE (migrate to files below)
    ui/
      index.ts                 ← barrel exports
      Button.tsx
      Card.tsx
      Badge.tsx
      SectionTitle.tsx
      Progress.tsx
      Modal.tsx
      EmptyState.tsx
      Input.tsx                ← NEW
      Select.tsx               ← NEW
      Textarea.tsx             ← NEW
      Switch.tsx               ← NEW
      Tabs.tsx                 ← NEW
      DropdownMenu.tsx         ← NEW
      Tooltip.tsx              ← NEW
      Toast.tsx                ← NEW
      Skeleton.tsx             ← NEW
      Spinner.tsx              ← NEW
      FormField.tsx            ← NEW
```

## Phase 1 — Design Tokens (styles.css)

### Hybrid Token System

| Source | Token | Value |
|--------|-------|-------|
| Supabase | `--bg` | `#171717` |
| Supabase | `--surface` | `#1c1c1c` |
| Supabase | `--fg` / `--fg-2` / `--muted` / `--meta` | 4-tier foreground ramp |
| Supabase | `--border` / `--border-soft` | `#2e2e2e` / `#242424` |
| Supabase | `--accent` | keep current blue |
| Vercel | type scale (xs→4xl) | 12/14/16/20/24/32/40/48px |
| Vercel | `--tracking-display` | `-0.02em` |
| Dashboard | `--radius-sm/md/lg` | 8/12/18px |
| Dashboard | `--elev-raised` | `0 18px 46px rgba(0,0,0,0.4)` |
| Craft:color | semantic `--success/warn/danger/info` | green/amber/red/blue |
| Craft:motion | `--motion-fast/base`, `--ease-standard` | 150ms / 200ms / cubic-bezier(0.2,0,0,1) |
| Craft:accessibility | `--focus-ring` | layered ring-offset pattern |

### Anti-AI-Slop Fixes

| Current pattern | Issue | Fix |
|---|---|---|
| Violet `#6422d5` active nav | Two accents (blue + violet) | Remove violet, use single blue accent |
| Indigo-adjacent violet | Slop-adjacent | Replace with accent-tinted transparency |
| Colored left-border cards | Slop tell | Remove left-border accent on cards |
| No type-scale letter-spacing | Missing craft rule | Add tracking per typography.md |

## Phase 2 — Component Library (src/components/ui/)

### Button
- Variants: `primary`, `secondary`, `ghost`, `danger`, `brand`
- Sizes: `sm`, `md`, `lg`
- States: default, hover, active, focus-visible, disabled, loading
- Pill radius (9999px) for primary, 6px for ghost

### Card
- No left-border accent
- Border-as-depth (1px `--border`), hover elevates border to accent-tint
- Optional `Card.Header`, `Card.Body`, `Card.Footer`

### Badge
- Variants: `default`, `accent`, `success`, `warn`, `danger`, `info`
- Optional dot indicator

### Input / Select / Textarea
- Wires `aria-describedby`, `aria-invalid`, `role="alert"`
- States: pristine, dirty, touched, invalid

### Modal
- Focus trap, escape handler, scroll lock, backdrop click dismiss
- `aria-modal="true"`, `role="dialog"`

### New Components
- `Tabs` — accessible ARIA tabpanel pattern
- `DropdownMenu` — click-toggle, portal to body
- `Skeleton` — shimmer animation for loading states
- `Toast` — auto-dismiss, stacked, `role="status"` + `aria-live="polite"`
- `FormField` — label + input + hint + error with all ARIA wiring

## Phase 3 — Accessibility Baseline

Every interactive element:
- Visible `--focus-ring` on `:focus-visible`
- Touch targets ≥ 44px
- ARIA labels where icon-only
- `prefers-reduced-motion` respected on all transforms

## Phase 4 — State Coverage

Every data-driven surface gets 3 states:
- `.state-loading` → skeleton/spinner
- `.state-empty` → EmptyState component
- `.state-error` → error message + retry

## Phase 5 — Git

- Commit all changes
- Push to GitHub
- Delete this PLAN.md after all items are verified complete
