# D7 GitHub Pages Showcase

This directory contains the static showcase site for D7 that deploys to GitHub Pages.

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. The workflow will automatically deploy when you push changes to `gh-pages/` folder

### 2. Update URLs

Before deploying, update these URLs in `index.html`:

- **Line 30**: Update the Netlify app URL in the "Play Now" button
- **Line 215**: Update the GitHub repository URL in the footer

### 3. OG Image (Optional but Recommended)

For better social media sharing:

1. Convert `assets/og-image.svg` to PNG format (1200x630px)
2. Save it as `assets/og-image.png`
3. Update the meta tag in `index.html` (line 9) to reference the PNG

You can use ImageMagick:
```bash
convert assets/og-image.svg assets/og-image.png -resize 1200x630
```

Or use online tools like CloudConvert, or design tools like Figma/Canva.

### 4. Deploy

Simply push changes to the `gh-pages/` folder on the `main` branch, and GitHub Actions will automatically deploy to GitHub Pages.

Your site will be available at: `https://yourusername.github.io/D7/`

## File Structure

```
gh-pages/
  index.html      # Main HTML file
  styles.css      # All styling
  script.js       # Animations and interactions
  assets/
    og-image.svg  # Open Graph image (SVG placeholder)
    README.md     # Asset documentation
```

## Customization

- **Colors**: Edit CSS variables in `styles.css` (lines 3-15)
- **Content**: Edit sections in `index.html`
- **Animations**: Modify `script.js` for different interaction behaviors

## Notes

- The site is fully static (no build step required)
- All animations respect `prefers-reduced-motion` for accessibility
- The design is mobile-first and responsive
- Fonts are loaded from Google Fonts (Bangers + Inter)
