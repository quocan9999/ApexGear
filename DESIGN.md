---
name: Lumina Tech
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#424754'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#e1e3e4'
  on-secondary-container: '#626566'
  tertiary: '#595c60'
  on-tertiary: '#ffffff'
  tertiary-container: '#727578'
  on-tertiary-container: '#fcfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e1e3e4'
  secondary-fixed-dim: '#c5c7c8'
  on-secondary-fixed: '#191c1d'
  on-secondary-fixed-variant: '#454748'
  tertiary-fixed: '#e0e2e6'
  tertiary-fixed-dim: '#c4c7ca'
  on-tertiary-fixed: '#191c1f'
  on-tertiary-fixed-variant: '#44474a'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  xxl: 80px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The brand personality is precise, efficient, and forward-thinking. It caters to a tech-savvy audience that values clarity and performance over decorative flair. The emotional response is one of "organized calm"—a shopping experience that feels light, fast, and remarkably easy to navigate.

The design system employs a **Modern Minimalist** style. It prioritizes functional aesthetics by using generous whitespace, high-contrast typography, and a "content-first" hierarchy. There are no gradients or unnecessary textures; depth is achieved through intentional layering of flat surfaces rather than skeuomorphic effects. The result is a professional, clinical yet inviting digital environment that mirrors the premium hardware it showcases.

## Colors

The palette is strictly controlled to maintain a "bright" and "clean" technical atmosphere. 

- **Primary (#3B82F6):** A vibrant tech blue used exclusively for calls to action, active states, and critical brand identifiers.
- **Secondary / Surface (#F9FAFB):** This light gray serves as the background for the entire application, preventing the "starkness" of pure white while maintaining a high-key aesthetic.
- **Neutral / Text (#1F2937):** A deep charcoal used for primary text to ensure maximum readability and a professional weight.
- **Border / Muted (#E5E7EB):** A subtle gray for structural separators and inactive states.

Pure white (#FFFFFF) is reserved for "Card" backgrounds to create a subtle lift against the secondary background.

## Typography

Inter is the sole typeface for the design system to ensure a systematic, utilitarian feel. The hierarchy relies on substantial weight shifts and generous line heights rather than multiple font families.

Headlines use tight letter-spacing and bold weights to ground the layout, while body copy utilizes a standard tracking to maximize legibility. For mobile, headline sizes scale down aggressively to ensure no more than three words per line on hero sections, maintaining the "breathable" quality. Labels use a slight uppercase treatment with increased letter spacing to differentiate them from interactive body text.

## Layout & Spacing

The design system uses a **Fluid 12-Column Grid** for desktop and a **4-Column Grid** for mobile. The philosophy is "Maximum Breathing Room." 

- **Vertical Rhythm:** Large sections (e.g., Hero to Product Grid) are separated by `xxl` (80px) spacing to create distinct visual chapters.
- **Component Padding:** Elements like cards and input fields use `lg` (24px) internal padding to avoid a "cramped" feeling.
- **Margins:** Desktop views use a fixed `container-max` centered on the screen. Mobile views use a strict `margin-mobile` of 16px to maximize the narrow real estate while preventing content from touching the screen edges.

## Elevation & Depth

This design system avoids heavy shadows and complex gradients, opting instead for **Tonal Layering** and **Subtle Elevation**.

1.  **Level 0 (Base):** The #F9FAFB background.
2.  **Level 1 (Cards/Containers):** Pure #FFFFFF surfaces with no border. Depth is conveyed via a very soft, diffused shadow: `0px 4px 20px rgba(0, 0, 0, 0.03)`.
3.  **Level 2 (Interactive/Hover):** When a card or button is hovered, the shadow tightens and slightly darkens: `0px 8px 30px rgba(0, 0, 0, 0.06)` to simulate the element physically lifting toward the user.
4.  **Dividers:** Used only when necessary, dividers are 1px solid lines using #E5E7EB. Prefer whitespace over lines whenever possible.

## Shapes

The shape language is "Soft-Technical." By using a consistent `0.25rem` (4px) base radius, we maintain a crisp, professional edge that feels precise, while the slight rounding prevents the UI from feeling sharp or aggressive.

- **Small elements (Buttons, Inputs):** 4px radius.
- **Large elements (Product Cards, Modals):** 8px radius (rounded-lg).
- **Specialty elements (Chips/Tags):** Fully rounded (pill) to distinguish them from interactive buttons.

## Components

- **Buttons:** Primary buttons are solid Blue (#3B82F6) with white text. Secondary buttons are #F9FAFB with #1F2937 text. No borders. All buttons have a fixed height of 48px for a comfortable "touch" target.
- **Input Fields:** Use a white background with a 1px #E5E7EB border. On focus, the border changes to #3B82F6 with a 2px outer glow.
- **Cards:** Product cards must have a white background, no border, and the Level 1 subtle shadow. Imagery should be centered with at least 24px of internal padding from the card edge.
- **Chips:** Small status indicators (e.g., "In Stock", "New") use a pill shape with a light gray background (#E5E7EB) and small, bold charcoal text.
- **Lists:** Clean, borderless rows with 16px of vertical padding. Use a 1px #E5E7EB separator only between list items, not at the top or bottom of the container.
- **Checkboxes/Radios:** Use the Primary Blue for selected states. The inactive state is a 1px #E5E7EB border.