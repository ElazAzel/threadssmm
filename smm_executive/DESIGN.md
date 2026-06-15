---
name: SMM Executive
colors:
  surface: '#0f141a'
  surface-dim: '#0f141a'
  surface-bright: '#353941'
  surface-container-lowest: '#0a0e15'
  surface-container-low: '#181c22'
  surface-container: '#1c2027'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2ec'
  on-surface-variant: '#c0c7d5'
  inverse-surface: '#dfe2ec'
  inverse-on-surface: '#2c3138'
  outline: '#8a919f'
  outline-variant: '#404753'
  surface-tint: '#a3c9ff'
  primary: '#a3c9ff'
  on-primary: '#00315d'
  primary-container: '#1493ff'
  on-primary-container: '#002a51'
  inverse-primary: '#0060ab'
  secondary: '#d1bcff'
  on-secondary: '#3d0090'
  secondary-container: '#5919c1'
  on-secondary-container: '#c5abff'
  tertiary: '#ffb689'
  on-tertiary: '#512300'
  tertiary-container: '#e56f03'
  on-tertiary-container: '#471e00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d3e3ff'
  primary-fixed-dim: '#a3c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004883'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#24005b'
  on-secondary-fixed-variant: '#5714be'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#ffb689'
  on-tertiary-fixed: '#321300'
  on-tertiary-fixed-variant: '#743500'
  background: '#0f141a'
  on-background: '#dfe2ec'
  surface-variant: '#31353c'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  table-text:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1440px
  sidebar-width: 240px
  gutter: 24px
---

## Brand & Style

The design system is engineered for high-performance Social Media Management, specifically optimized for the Threads ecosystem. It prioritizes clarity, speed, and professional utility over decorative trends. The aesthetic is "Technical Minimalist"—drawing inspiration from industry-leading developer tools like Linear to create an environment where data is the hero.

The brand personality is authoritative yet unobtrusive. It avoids the playful, rounded "consumer-app" feel in favor of a precise, serious, and commercial interface. This design system evokes a sense of control and systematic efficiency, utilizing a dark-first approach to reduce eye strain during long periods of strategic planning and content scheduling.

## Colors

The palette is centered on a "Midnight Navy" foundation to support a dark-first user experience. The primary accent is a high-vibrancy Electric Blue, used sparingly for primary actions and focus states. A muted Violet provides a secondary dimension for categorizing Threads-specific features or AI-driven insights without resorting to stereotypical gradients.

**Dark Mode (Primary Environment):**
- **Base:** #0A0A0C (Deepest layer, used for page backgrounds).
- **Secondary:** #141416 (Navigation bars and sidebars).
- **Surface:** #1F1F23 (Card backgrounds and input fields).

**Light Mode (Secondary Environment):**
The light mode reverses this hierarchy using #F7F7F8 for backgrounds and #FFFFFF for elevated surfaces, maintaining the Slate (#3F3F46) text for optimal legibility.

**Status Colors:**
Used for sentiment analysis, post status, and system health. They are used in high-saturation variants against the dark UI to ensure immediate recognition.

## Typography

This design system utilizes **Inter** as its workhorse typeface. Its neutral, grotesque letterforms provide the high legibility required for data-dense SMM dashboards. For technical metadata and system labels, a secondary monospaced font (**JetBrains Mono**) is used to distinguish system-generated data from user content.

**Hierarchy Strategy:**
- **Display & Headlines:** Tight tracking and high-weight bolding for a confident, editorial feel.
- **Body:** Standardized at 14px for the majority of the UI to maximize information density while maintaining readability.
- **Table Text:** Reduced to 13px to allow for complex multi-column layouts without overcrowding.
- **Labels:** Uppercase monospaced text for status badges, timestamps, and small UI markers.

## Layout & Spacing

The layout operates on a strict **8px linear grid system**. This ensures consistent alignment across complex dashboard components. 

**Structure:**
- **Grid Model:** 12-column fluid grid for main content areas, with a fixed sidebar for navigation.
- **Margins:** A standard 24px (md) margin is applied to most containers, expanding to 48px (lg) for high-level marketing or landing pages.
- **Density:** The design system favors "Information-Dense" layouts. Content cards should use compact padding (16px to 20px) to allow more data to be visible above the fold.
- **Breakpoints:**
    - Mobile: <768px (Single column, 16px margins).
    - Tablet: 768px - 1024px (Reduced sidebar or drawer).
    - Desktop: >1024px (12-column grid, max-width 1440px).

## Elevation & Depth

In the dark-first UI of this design system, depth is conveyed through **tonal layering and subtle borders** rather than heavy shadows.

- **Level 0 (Base):** #0A0A0C. Used for the application background.
- **Level 1 (Surface):** #141416. Used for sidebars and secondary navigation.
- **Level 2 (Cards):** #1F1F23. Used for the primary content blocks. Every card must have a 1px solid border (#2D2D33) to provide definition against the dark background.
- **Level 3 (Popovers/Modals):** These use the Level 2 background but include a soft, diffused ambient shadow (Black, 40% opacity, 20px blur) and a slightly brighter 1px border (#3F3F46).

**Glassmorphism:** Use backdrop-blur (12px) on sticky headers and navigation bars to provide a sense of context and depth as content scrolls beneath.

## Shapes

The shape language balances modern softness with professional rigidity. 

- **Primary Radius:** 0.5rem (8px). Used for standard buttons, input fields, and small UI components.
- **Large Radius (rounded-lg):** 1rem (16px). Used for main dashboard cards and containers to create a distinct visual separation between different feature modules.
- **Extra Large (rounded-xl):** 1.5rem (24px). Reserved for decorative elements or promotional banners.

All borders should be kept at a constant 1px width to maintain a crisp, technical appearance.

## Components

**Buttons:**
- **Primary:** Electric Blue background, white text. No gradient. Sharp hover state transition to a slightly brighter blue.
- **Secondary:** Ghost style. Transparent background with a 1px border (#1F1F23) and white text.
- **Tertiary:** Pure text buttons with monospaced labels for utility actions.

**Status Chips:**
Small, pill-shaped badges (rounded-full). They utilize a low-opacity background of the status color (e.g., 10% Green) with high-saturation text (e.g., 100% Green) for clear communication without being visually overwhelming.

**Input Fields:**
Dark backgrounds (#1F1F23) with a subtle 1px border. On focus, the border transitions to the primary Electric Blue with a very soft, 2px outer glow of the same color.

**Cards:**
Every card in the dashboard should use a 16px corner radius. Headlines within cards should use `headline-md` or `body-lg` depending on importance.

**Tables:**
Crucial for SMM management. Use 1px horizontal dividers only. No vertical lines. Header row should use `label-caps` typography with a subtle background tint (#141416).