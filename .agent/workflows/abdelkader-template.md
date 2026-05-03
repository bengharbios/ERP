---
description: Abdelkader Template - The Ultimate 2026 ERP Design Standard
---

# Abdelkader Template (Ultimate 2026 Standard)

This template represents the peak of modern, premium, and RTL-optimized design for the Institute ERP system. It follows a consistent structure for headers, toolbars, stats grids, and data displays.

## 1. Header & Typography (Cairo Standard)
- **Font**: MUST use `'Cairo', sans-serif` for all Headers (`h1`, `h2`, `h3`).
- **Mobile Header (White Card)**:
    - Style: `background: white`, `border-radius: 24px`, `box-shadow` (Card Style).
    - **Title Position**: Absolute Center (`text-align: center`, `width: 100%`).
    - **Icon Position**: Absolute Right (`right: 1.5rem`) to guarantee ZERO title shifting.
- **Desktop Header (Glass)**:
    - Style: `backdrop-filter: blur(12px)`, `background: rgba(255,255,255,0.9)`.
    - Content: Icon Right, Text Right, Actions Left.

## 2. Filters Toolbar (Desktop)
- **Order (Unified Standard)**: Filters Group (Selects) MUST be on the RIGHT (First Child), Search Box on the LEFT (Last Child).
- **Styling**: White background, 20px border radius, subtle shadow, and a 32px vertical divider.
- **Input Height**: Standardized at 48px for a premium touch.

## 3. Mobile Search & Filter (Card Container)
- **Structure**: Single White Card Container (`background: white`, `padding: 0.75rem`).
- **Elements**: 
    - **Search Input**: Gray Background (`#F9FAFB`), No Shadow.
    - **Filter Button**: White with Border, on the LEFT (visually, in RTL).
- **Layout**: Input and Button inside the same white card wrapper.
- **FAB (Floating Action Button)**: Large circular orange button (64px) with a `<Plus />` icon centered (`size={32}`), No Border.
- **Mobile Page Order**: 
    1. Header (Sticky)
    2. Search Area (Floating Card)
    3. Stats Grid (2 Cols)
    4. Main Content (Cards)
- **Responsive**: 4 columns on desktop, 2 columns on ALL mobile screens.
- **Layout (RTL Optimization)**: Label on the RIGHT, Value on the LEFT inside each card to maintain natural Arabic reading flow.
- **Visuals**: Use `border-right: 4px solid [Color]` for distinct categorization.

## 5. Data Display
- **Grid Mode**: Premium cards with status tags, avatars, and a footer action.
- **Desktop Table (Floating Rows 2026)**:
    - **Structure**: `border-collapse: separate`, `border-spacing: 0 12px` (Rows act as floating cards).
    - **Row Style**: White background, `border-radius: 12-16px`, subtle shadow, Hover Lift effect (`transform: translateY(-3px)`).
    - **Header**: Transparent background, text-only labels (gray), aligned with columns.

## 6. Mobile Drawer (Filters)
- **Overlay**: Blurred dark background.
- **Content**: Slides from the right, containing all filtering options with "Apply" and "Reset" buttons.

## Master CSS Constants (SCSS-like)
- **Orange Primary**: `#DD6B20`
- **Orange Gradient**: `linear-gradient(135deg, #DD6B20 0%, #ED8936 100%)`
- **Glass BG**: `rgba(255, 255, 255, 0.85)`
- **Radius**: `20px` (Cards/Toolbars), `12px` (Buttons/Inputs)

## 8. Mobile Precision Standards (The "Programs" Signature Look)
- **Header Geometry**: 
    - `height: 70px`, `margin: 0.5rem 0.75rem`, `border-radius: 20px`.
- **Absolute Centering Technique**: 
    - `header-content` must be `display: block !important` with `text-align: center !important`.
    - `header-branding` must be `display: inline-flex !important` for perfect horizontal/vertical centering.
- **Typography & Content**:
    - **Hide Subtitles & Desktop Actions**: Set `branding-text p` AND all desktop-only buttons (like status pills) to `display: none !important` to keep the frame perfectly centered.
    - **Title Scale**: Set `h1` to `1.1rem !important` for maximum impact.
    - **Visual Down-Nudge**: Apply `padding-top: 4px` to the branding block for font-level vertical symmetry.
- **Body Content Scaling**: 
    - Search Input: Reduced to `0.85rem`.
    - Table/Matrix Text: Scaled to `0.8rem` for primary and `0.7rem` for secondary.
    - Status Pills: Standardized at `0.7rem` font and compact padding.
