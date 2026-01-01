# D7 - Hafte Kasif Tournament Tracker 🃏🇩🇰

A tournament tracking app for **Hafte Kasif** (also known as **Bisheori**) — a card game that's basically what happens when Uno has a chaotic Danish-Persian cousin.

This app is used by a group of friends in Denmark to track our bi-weekly tournament battles and settle the eternal question: *who is the true card game champion?*

## The Players

The legendary competitors:

- 🎯 **Babak** *(the one who built this thing)*
- 🃏 **Khosrow**
- 🎲 **Mohsen**
- 🏆 **Massoud**
- ♠️ **Mehdi**
- 6️⃣ **Hussein 6**
- 🎸 **Hussein Gaga**
- ♦️ **Behzad**

## What is Hafte Kasif?

Hafte Kasif is a card game variant combining elements of Uno and other trick-taking games. The rules are... let's say *locally defined* and fiercely debated. If you're not part of our group, you probably won't understand the scoring. And that's okay. 😄

## Features

- 🏆 **Tournament Management** — Create and manage bi-weekly tournaments
- 👥 **Player Profiles** — Track players with avatars and stats
- 📊 **Scoring System** — Event-sourced scoring with full history
- 📱 **Mobile-First** — Built for quick score entry between rounds
- 🌙 **Dark Mode** — For those late-night tournament sessions

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Netlify Functions (Node.js)
- **Database**: PostgreSQL (Neon)
- **Deployment**: Netlify

## For Developers

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Netlify account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and ADMIN_PASSWORD

# Run database migrations
# Execute netlify/migrations/001_initial_schema.sql in your PostgreSQL database

# Start development server
npm run dev

# Or test with Netlify functions locally
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
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities (scoring, API)
│   ├── pages/           # Page components
│   └── styles/          # Global styles
└── docs/                # Documentation
```

## Contributing

This is a personal project for our friend group, but if you somehow ended up here and want to adapt it for your own card game tournaments — go for it! Fork away. 🍴

## Author

**Babak Bandpey** — [cocode.dk](https://cocode.dk)

## License

MIT — Use it, modify it, make your own tournament tracker for whatever weird card game your friends invented.

---

*Built with ☕ and competitive spirit in Denmark*
