---
name: TradeMind Design System
colors:
  surface: '#13131b'
  surface-dim: '#13131b'
  surface-bright: '#393841'
  surface-container-lowest: '#0d0d15'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#292932'
  surface-container-highest: '#34343d'
  on-surface: '#e4e1ed'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e4e1ed'
  inverse-on-surface: '#302f38'
  outline: '#908f9e'
  outline-variant: '#454652'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#121f8b'
  primary-container: '#5e6ad2'
  on-primary-container: '#fdfaff'
  inverse-primary: '#4854bb'
  secondary: '#44e2cd'
  on-secondary: '#003731'
  secondary-container: '#03c6b2'
  on-secondary-container: '#004d44'
  tertiary: '#ffb955'
  on-tertiary: '#452b00'
  tertiary-container: '#a06800'
  on-tertiary-container: '#fffaf9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dfe0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000965'
  on-primary-fixed-variant: '#2e3aa2'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb955'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#13131b'
  on-background: '#e4e1ed'
  surface-variant: '#34343d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  data-tabular:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-caps:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 20px
  margin-safe: 32px
---

## Brand & Style
The design system embodies "Intellectual Velocity"—a synthesis of high-frequency data density and cognitive ease. It targets serious learners who require professional-grade tools without the intimidating friction of traditional brokerage software.

The aesthetic is **Technical Minimalist**. It leverages the dark, focused environment of modern developer tools (Linear), the information hierarchy of financial terminals (Bloomberg), and the progressive disclosure patterns of educational platforms (Duolingo). The emotional goal is to make the user feel like a "quant in training": disciplined, informed, and calm.

Key visual pillars include:
- **Atmospheric Depth:** A foundation of deep obsidian layers separated by light and glass rather than heavy shadows.
- **Data Confidence:** Precision-engineered typography and hairline strokes that suggest accuracy.
- **Guidance:** Subtle use of the "Mastery Teal" to highlight educational progress and successful signal identification.

## Colors
This design system utilizes a "Void-Plus" palette. The core experience is anchored in `#050507` to eliminate ocular strain during long study sessions.

- **Background Strategy:** Use `--bg-deep` for the document body. Use `--bg-base` for primary workspace containers. Use `--bg-elevated` for floating panels or interactive cards.
- **Accents:** 
    - **Indigo (#5E6AD2):** Action-oriented. Used for primary buttons, focus states, and active learning paths.
    - **Teal (#2DD4BF):** Success-oriented. Used for completed modules, correct answers, and "In the Green" market scenarios.
    - **Amber/Red:** Status-oriented. Used for alerts and risk-management simulations.
- **Transparency:** The `surface_glass` token must always be paired with a `backdrop-filter: blur(20px) saturate(180%)` to maintain legibility against the background "aurora" motion.

## Typography
The system uses a bifurcated typographic scale: **Inter** for all UI and instructional prose, and **Geist Mono** for all quantitative data.

- **Inter Implementation:** Utilize variable weight axes to differentiate between instructional content (Regular 400) and interactive UI (Medium 500).
- **Geist Mono Implementation:** Essential for price tickers, percentage changes, and terminal inputs. The `tabular-nums` feature must be enabled to prevent "jitter" during real-time data updates.
- **Visual Rhythm:** Headlines should use tighter letter-spacing (`-0.01em` to `-0.02em`) to maintain the "Linear" aesthetic of high-density sophistication.

## Layout & Spacing
The layout relies on a **12-column Fluid Grid** for dashboard views and a **Fixed Column (800px)** layout for deep-reading educational modules.

- **Spacing Rhythm:** Based on a 4px baseline. Most UI gaps should settle on `16px` (md) or `24px` (lg).
- **Density:** High density is preferred for market data components, while "Learning Mode" increases vertical padding to `40px` (xl) to reduce cognitive load.
- **Breakpoints:**
    - **Mobile (< 768px):** Single column, 16px safe margins, hidden sidebar (drawer).
    - **Tablet (768px - 1200px):** 12-column grid, 20px gutters, collapsed iconography sidebar.
    - **Desktop (> 1200px):** 12-column grid, 24px gutters, permanent left-hand navigation.

## Elevation & Depth
Depth is created through "Internal Illumination" rather than external shadows.

1.  **Level 0 (Base):** `#050507`.
2.  **Level 1 (Sub-section):** `#0A0A0F`. 1px hairline border `rgba(255,255,255,0.08)`.
3.  **Level 2 (Interactive Card):** `#101018`. Includes a 1px top-edge inner highlight (`white` at 0.05 opacity) to simulate a physical edge catching light from above.
4.  **Level 3 (Overlays):** `surface_glass` with 20px backdrop blur.

**Motion:** All state transitions (hover, active, toggle) must use spring physics. Avoid linear easing. The background should feature "Aurora Blobs"—slow-moving, low-opacity (#5E6AD2 at 0.05) organic shapes that provide a sense of life without distracting from data.

## Shapes
The shape language balances professional rigidity with approachable learning.

- **Cards/Panels:** `16px` (rounded-lg) for large containers to soften the terminal aesthetic.
- **Controls/Inputs:** `10px` for buttons, text fields, and dropdowns. This creates a distinct "tappable" feel separate from the container layout.
- **Status/Badges:** Pill-shaped (`999px`) for tags, mastery levels, and "Live" indicators to provide maximum visual contrast against the rectangular grid.
- **Borders:** Always use `1px` (hairline) width. Never use 2px or thicker borders except for high-accessibility focus states.

## Components
- **Primary Button:** Indigo background, white text, 10px radius. On hover, apply a subtle inner glow rather than a drop shadow.
- **Glass Card:** Used for instructional overlays. Must have the 1px hairline border and 20px blur. Content should have high contrast (White or Mastery Teal).
- **Data Cells:** Monospaced Geist Mono. Positive values in Teal, negative in Danger Red. Use "ghost" backgrounds (low opacity teal/red) to highlight the entire cell on change.
- **Learning Progress:** A thin (2px) progress bar at the very top of the viewport using the Mastery Teal accent. No container, just a floating line.
- **Inputs:** Darker than the card background (`#050507`), 1px `border-hair` that transitions to `border-active` on focus.
- **Candlestick Glyph:** The logo wordmark should be accompanied by a single candlestick where the "wick" (vertical line) animates its height on page load, symbolizing growth and data precision.