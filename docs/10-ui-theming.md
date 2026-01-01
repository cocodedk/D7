# UI & Theming

## Design Principles

- **Mobile-first**: 375px baseline
- **Large tap targets**: Minimum 44x44px
- **Minimal navigation**: Bottom tabs or drawer
- **No silent actions**: All changes require confirmation
- **Modern aesthetic**: Clean, minimal, professional

## Dark & Light Mode

### Theme Provider
- React Context for theme state
- Persists preference in localStorage
- System preference detection (optional)
- Toggle in settings

### Color Palette

**Light Mode**
- Background: White/light gray
- Text: Dark gray/black
- Primary: Blue or brand color
- Accent: Green (I), Red (X)
- Borders: Light gray

**Dark Mode**
- Background: Dark gray/black
- Text: Light gray/white
- Primary: Lighter blue
- Accent: Green (I), Red (X)
- Borders: Dark gray

## Component Styling

- Tailwind CSS for utility classes
- Custom theme configuration
- Consistent spacing scale
- Typography scale for mobile

## Key UI Elements

### Buttons
- Large, rounded corners
- Clear visual hierarchy
- Disabled states
- Loading states

### Cards
- Subtle shadows/borders
- Rounded corners
- Proper padding
- Touch-friendly spacing

### Inputs
- Large tap targets
- Clear labels
- Error states
- Mobile keyboard optimization

## Responsive Design

- Mobile-first breakpoints
- Touch-optimized interactions
- No hover states (mobile-only)
- Swipe gestures where appropriate
