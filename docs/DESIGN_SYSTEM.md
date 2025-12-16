# HAIRDO Design System

Inspired by high-end technical/eyewear aesthetic with precision and sophistication.

## Core Principles

### 1. **Technical Precision**
- Ultra-tight typography (10-12px base)
- Monospace-inspired tracking (0.15em - 0.2em letter-spacing)
- ALL_CAPS with underscores for technical feel
- Model number aesthetic (PARAM_01, CONFIG_v1.0)

### 2. **Dark Minimalism**
- Base: #070707 (near black)
- Subtle blue radial gradient from top
- White/10-40% opacity for UI elements
- High contrast white text

### 3. **Geometric Framing**
- Corner bracket markers (L-shaped borders)
- Technical grid overlays (100px repeating)
- Precise spacing and alignment
- Border animations on interaction

### 4. **Micro-Interactions**
- Scale transforms on hover (1.05-1.1x)
- Opacity shifts (0.6 → 1.0)
- Smooth 300-700ms transitions
- Shimmer effects on buttons

## Typography Scale

```css
text-[10px] tracking-widest  // Labels, meta
text-xs tracking-wider       // Body text
text-sm tracking-wide        // Inputs, buttons
text-[clamp(3rem,12vw,8rem)] // Hero titles
```

## Color Tokens

```css
Background:  #070707
Foreground:  #FAFAFA
Border:      white/10-30%
Accent:      #0070E3 (Lisk blue)
Success:     #22C55E
```

## Component Patterns

### Upload Zone
- Aspect-square container
- Corner brackets outside
- Grid overlay at 5% opacity
- Scale 1.05 on hover
- Technical status labels

### Configuration Panel
- Vertical param labels (PARAM_01, PARAM_02)
- Dark select backgrounds (black/40)
- Hover border transitions
- Status indicators with pulse animation

### Buttons
- Uppercase tracking-widest text
- Shimmer gradient on hover
- Relative z-index for layering
- Min height 48-56px for touch

## Animation Timing

```javascript
duration-300  // Quick UI feedback
duration-500  // Standard transitions
duration-700  // Dramatic reveals
ease-in-out   // Most interactions
```

## Grid System

- Max container: 7xl (1280px)
- 2-column layout on desktop
- Single column mobile
- 8px base spacing unit

## Accessibility

- Minimum 40px touch targets
- Proper ARIA labels needed
- Focus visible states
- Semantic HTML structure

## Future Enhancements

- [ ] GSAP clip-path animations
- [ ] Counter with number cycling
- [ ] Infinite scroll galleries
- [ ] Video reveal transitions
- [ ] Technical loading sequences
