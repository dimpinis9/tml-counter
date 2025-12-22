# Tomorrowland-Inspired Countdown Widget

A premium full-screen countdown component with magical Art-Nouveau/festival fantasy aesthetics featuring gold/purple gradients, ornamental SVG decorations, and animated dust particles.

## Features

- ✨ Full-screen immersive design with gradient backgrounds
- ⏰ Accurate day countdown that updates automatically at local midnight
- 🎨 Gold/purple glow effects with CSS animations
- ♿ Fully accessible (ARIA labels, keyboard navigation, reduced motion support)
- 🖼️ Optional logo watermark background
- 📱 Responsive design
- ⚡ Performance-optimized (25 particles max, memoized calculations)
- 🎯 No external dependencies (pure React + CSS)

## Usage

### Next.js 14 App Router

```tsx
"use client";

import TomorrowlandCountdown from "./TomorrowlandCountdown";

export default function Page() {
  return (
    <TomorrowlandCountdown
      targetDate="2026-07-17"
      logoSrc="/tomorrowland-logo.svg"
      logoAlt="Tomorrowland Logo"
    />
  );
}
```

### Vite + React

```tsx
import TomorrowlandCountdown from "./TomorrowlandCountdown";

function App() {
  return (
    <TomorrowlandCountdown
      targetDate="2026-07-17"
      logoSrc="/tomorrowland-logo.svg"
      logoAlt="Tomorrowland Logo"
    />
  );
}

export default App;
```

## Props

| Prop         | Type     | Default           | Description                                                  |
| ------------ | -------- | ----------------- | ------------------------------------------------------------ |
| `targetDate` | `string` | `"2026-07-17"`    | Target date in YYYY-MM-DD format (local timezone)            |
| `logoSrc`    | `string` | `undefined`       | Optional path to logo image (e.g., "/tomorrowland-logo.svg") |
| `logoAlt`    | `string` | `"Festival Logo"` | Alt text for logo accessibility                              |

## Logo Setup

### With Logo

Place your logo file in the `public` folder:

```
public/
  └── tomorrowland-logo.svg
```

Then use it:

```tsx
<TomorrowlandCountdown logoSrc="/tomorrowland-logo.svg" />
```

### Without Logo

If you don't provide `logoSrc`, the component will display an abstract CSS/SVG festival emblem instead.

```tsx
<TomorrowlandCountdown targetDate="2026-07-17" />
```

## How It Works

### Day Calculation

The component calculates **full days** between today's local midnight and the target date's local midnight:

- Uses `Date` constructor for local timezone calculations
- Updates automatically at midnight using `setTimeout` + `setInterval`
- Clamps minimum value at 0 (won't show negative days)

### Performance

- Particle positions are memoized to prevent recalculation
- Only 25 particles to avoid heavy rendering
- Animations disabled when `prefers-reduced-motion` is set

### Accessibility

- Semantic HTML with proper ARIA labels
- Screen reader announcements for countdown updates (`aria-live="polite"`)
- High contrast text (WCAG AA compliant)
- Respects user's motion preferences
- Keyboard navigable

## Customization

You can modify the appearance by editing the `<style>` block in the component:

- **Colors**: Change gradient stops, gold (`#ffd700`), purple (`#2d1b4e`, `#9333ea`)
- **Animations**: Adjust `glow-pulse`, `float`, `ornament-shine` keyframes
- **Particles**: Change count in `Array.from({ length: 25 })`
- **Typography**: Modify font sizes in `.tml-days-number`, `.tml-label`, etc.

## Browser Support

Works in all modern browsers that support:

- CSS custom properties
- CSS Grid/Flexbox
- ES6+ JavaScript
- React 18+

## License

MIT - Feel free to use in personal or commercial projects.

## Important Notes

⚠️ **VERIFY TARGET DATE**: The default date (2026-07-17) should be confirmed against official Tomorrowland announcements.

⚠️ **LOGO COPYRIGHT**: Do not use official Tomorrowland logos without permission. This component is designed to work with your own assets or the provided fallback emblem.
