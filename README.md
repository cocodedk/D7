# D7 Card Game

A mobile-first web application for scoring the D7 card game, built with React, TypeScript, and Netlify Functions.

## Features

- Event-sourced scoring system
- Tournament management with lifecycle states
- Player management with avatars
- Two-phase game recording (staging + confirmation)
- Dark/light mode support
- Mobile-optimized UI

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Netlify Functions (Node.js)
- **Database**: PostgreSQL (Neon)
- **Deployment**: Netlify

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Netlify account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local` for local development
   - Set `ADMIN_PASSWORD` and `DATABASE_URL` in Netlify dashboard

3. Run database migrations:
   - Execute `netlify/migrations/001_initial_schema.sql` in your PostgreSQL database

4. Start development server:
```bash
npm run dev
```

5. Test Netlify functions locally:
```bash
netlify dev
```

## Project Structure

```
D7/
├── netlify/
│   ├── functions/       # Serverless API endpoints
│   └── migrations/      # Database migrations
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities (scoring, API)
│   ├── pages/          # Page components
│   └── styles/         # Global styles
└── docs/               # Documentation
```

## Deployment

1. Connect your Git repository to Netlify
2. Set environment variables in Netlify dashboard:
   - `ADMIN_PASSWORD`
   - `DATABASE_URL`
3. Deploy - Netlify will automatically build and deploy

## Documentation

See `docs/` directory for detailed implementation documentation.

## License

Private project
