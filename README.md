# 🌌 Tiny Universe

A shared digital cosmos of memory galaxies. Tiny Universe allows admins to create separate, password-protected universes. Each universe contains customizable star systems, which are populated by memory planets orbiting around central stars.

---

## Key Features

- 👑 **Admin Control Center** — Manage multiple universes, view systems/memory counts, configure custom slug links, and set guest entry passcodes.
- 🔐 **Guest Access Control** — Universes are locked behind unique guest passcodes verified via secure, server-side cookies.
- 🌟 **Ignite Star Systems** — Form solar systems with customizable star classifications (Yellow Dwarf, Blue Giant, Red Supergiant, Nebular Core, Pulsar Core) and custom star hex color mapping.
- 🪐 **Memory Planet Orbits** — Add memory planets to orbital lanes (Rings 1 to 4) orbiting around the star.
- 🌠 **Cosmic Orbits & Sizing** — Uses deterministic positioning algorithms to prevent visual overlaps on interactive orbital canvases.
- ✏️ **Full CRUD Operations** — Create, read, edit, and delete/dissolve both star systems and memory planets.
- 📱 **Responsive Mobile Splits** — Layout headers split gracefully on mobile views, shifting titles and universe subheadings below header navigation controls to maximize horizontal readability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 App Router (Turbopack), React 19, TypeScript 5 |
| **Styling** | Sass (SCSS Modules) |
| **Database** | MongoDB Atlas + Mongoose |
| **Data Fetching** | SWR (Client-side caching & mutators) |
| **Validation** | Zod (API schema validation) |
| **Security** | BCryptJS (Access code hashing) |
| **Toast System** | React Hot Toast |

---

## Project Setup

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd TinyUniverse
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` for local development:
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values (this file is gitignored and will never be committed):
```env
MONGODB_URI=mongodb://localhost:27017/tinyuniverse
UNIVERSE_PASSCODE=your-admin-passcode
```
- `MONGODB_URI`: Local MongoDB instance or MongoDB Atlas cluster connection string.
- `UNIVERSE_PASSCODE`: Master admin passcode to log in and access the creation dashboard.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                       # Main entry point (Admin login/dashboard, Guest unlock, Guest systems hub & canvas)
│   ├── layout.tsx                     # Main layout & root metadata definition
│   ├── page.module.scss               # Main entry page styling
│   └── api/
│       ├── admin/
│       │   ├── auth/route.ts          # Admin session login and status
│       │   └── universes/             # Admin CRUD endpoints for universes
│       ├── auth/
│       │   ├── logout/route.ts        # Admin/guest logout
│       │   └── status/route.ts        # Session verification
│       ├── memories/                  # CRUD endpoints for memories/planets
│       ├── solar-systems/             # CRUD endpoints for star systems
│       └── universe/
│           ├── [slugOrId]/route.ts    # Fetch universe layout and details
│           └── verify-access/route.ts # Verify guest universe passcodes
├── components/
│   ├── AddMemoryModal/                # Modal form to add a memory planet
│   ├── AdminDashboard/                # Admin interface to manage universes
│   ├── AdminLoginForm/                # Password entry for admin dashboard access
│   ├── EmptyState/                    # Placeholder for empty space system
│   ├── GuestSystemCanvas/             # Planet orbit screen with orbital canvas
│   ├── GuestSystemsHub/               # Dashboard of solar systems inside a universe
│   ├── GuestUnlockForm/               # Access code entry for guest universes
│   ├── Loader/                        # Cosmic loader/spinner
│   ├── MemoryModal/                   # Modal to view, edit, or delete a memory planet
│   ├── Planet/                        # Rendered SVG planet node
│   ├── UI/                            # Base components (Button, Modal, Card, SpaceBackground)
│   └── UniverseCanvas/                # Interactive canvas layer for orbit positioning
├── hooks/
│   ├── useMemories.ts                 # SWR query hook for memories
│   └── useSolarSystems.ts             # SWR query hook for star systems
├── lib/
│   ├── auth.ts                        # Password/session verification utilities
│   ├── constants.ts                   # Cosmic design parameters and orbits constants
│   ├── content.ts                     # Central copy & copy translation registry
│   ├── migration.ts                   # DB data migration script
│   └── mongodb.ts                     # Database connection singleton
├── models/
│   ├── Memory.ts                      # Mongoose schema for memory planets
│   ├── SolarSystem.ts                 # Mongoose schema for star systems
│   └── Universe.ts                    # Mongoose schema for universes
├── services/
│   ├── memory.service.ts              # DB layer helper for memories
│   ├── solarsystem.service.ts         # DB layer helper for solar systems
│   └── universe.service.ts            # DB layer helper for universes
├── types/
│   ├── memory.ts                      # TS interfaces for memories
│   ├── solarsystem.ts                 # TS interfaces for star systems
│   └── universe.ts                    # TS interfaces for universes
└── styles/
    ├── globals.scss                   # Global resets and CSS variables
    ├── mixins.scss                    # SASS responsive layout mixins
    └── variables.scss                 # SASS color, spacing, and typography tokens
```

---

## Architectural Notes

- **Multi-Universe Model**: Designed for scaling. Administrators can spawn separate universes with custom slugs, descriptions, and separate entry codes.
- **Access Verification**: Done using server-side cookies (HttpOnly, Secure) with standard expiry times, validated by Next.js middleware hooks.
- **Dynamic Orbital Calculations**: Position angles of planets are determined dynamically based on the number of objects per ring to guarantee zero visual overlapping or crowding.
- **Planet Coloring**: Planet color gradients are resolved deterministically from a hash of the planet's name, maintaining consistency across logins.
