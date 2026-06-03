# 🌌 Tiny Universe

A shared digital universe where every memory becomes a planet floating in space.

## Features

- 🔐 **Passcode-protected** — Secure access via HttpOnly cookie
- 🪐 **Memory Planets** — Every memory becomes a unique floating planet
- 🌠 **Dynamic Orbits** — Planets auto-assigned to orbital rings using golden angle distribution
- 📸 **Image Upload** — Attach photos via Vercel Blob storage
- ✏️ **Full CRUD** — Create, view, edit, and delete memories
- 📱 **Mobile-first** — Bottom sheet modals, responsive canvas, touch-friendly
- ♿ **Accessible** — Keyboard navigation, ARIA labels, focus management

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | SCSS Modules |
| Database | MongoDB Atlas + Mongoose |
| Storage | Vercel Blob |
| Data Fetching | SWR |
| Validation | Zod |
| Notifications | React Hot Toast |

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd TinyUniverse
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your real values (this file is gitignored — never committed):

```
MONGODB_URI=mongodb+srv://...
UNIVERSE_PASSCODE=your-secret-passcode
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

> **`.env.example`** — committed to git (no real values, just variable names as a template)
> **`.env.local`** — gitignored, holds your real secrets for local dev
> **Production (Vercel)** — set vars in Vercel dashboard, no file needed

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. First Launch Flow

1. Open the app → Enter your passcode
2. You'll be redirected to the **Setup page** to name your universe
3. Start adding memories → Each becomes a planet in your cosmos!

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing / Passcode
│   ├── setup/page.tsx        # Universe creation (first time)
│   ├── universe/page.tsx     # Main universe view
│   └── api/
│       ├── auth/verify-passcode/route.ts
│       ├── universe/route.ts
│       ├── memories/route.ts
│       ├── memories/[id]/route.ts
│       └── upload/route.ts
├── components/
│   ├── PasscodeForm/
│   ├── CreateUniverseForm/
│   ├── UniverseCanvas/
│   ├── Planet/
│   ├── MemoryModal/
│   ├── AddMemoryModal/
│   ├── EmptyState/
│   └── Loader/
├── lib/
│   ├── mongodb.ts            # DB connection singleton
│   ├── blob.ts               # Vercel Blob helpers
│   ├── constants.ts          # App-wide constants
│   └── orbit.ts              # Orbit/angle calculation
├── models/
│   ├── Universe.ts
│   └── Memory.ts
├── services/
│   ├── memory.service.ts
│   └── universe.service.ts
├── hooks/
│   ├── useMemories.ts
│   └── useUniverse.ts
├── types/
│   ├── memory.ts
│   └── universe.ts
└── styles/
    ├── globals.scss
    ├── variables.scss
    └── mixins.scss
```

## Deploy to Vercel

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add the 3 environment variables in Vercel dashboard
4. Deploy!

## Architecture Notes

- **Orbit assignment**: Uses golden angle (137.5°) distribution to prevent visual clustering
- **Planet colors**: Deterministically generated from title hash — consistent across sessions
- **Cookie auth**: HttpOnly, 30-day expiry, secure in production
- **One universe**: Designed for V1 single-universe model, extensible for multi-universe in V2
- **Images**: Only URLs stored in MongoDB; actual files live in Vercel Blob
