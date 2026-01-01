# Project Setup & Architecture

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Backend**: Node.js with Express (Netlify Functions)
- **Database**: PostgreSQL (Neon)
- **Deployment**: Netlify
- **Styling**: Tailwind CSS with dark/light mode
- **State Management**: React Context + hooks

## Project Structure

```
D7/
├── netlify/
│   └── functions/          # Serverless API endpoints
├── src/
│   ├── components/         # React components
│   ├── contexts/          # React contexts (auth, theme)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities (scoring engine, API)
│   ├── pages/             # Page components
│   └── styles/            # Global styles
├── public/                # Static assets
└── docs/                  # Documentation
```

## Netlify Configuration

- **Build command**: `npm run build`
- **Publish directory**: `dist` or `build`
- **Functions directory**: `netlify/functions`
- **Environment variables**: Admin password, database URL

## Development Setup

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run local dev server: `npm run dev`
4. Test Netlify functions locally: `netlify dev`

## Mobile-First Approach

- Base viewport: 375px
- Touch targets: minimum 44x44px
- Responsive breakpoints: mobile-first
- PWA-ready structure
