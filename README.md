# Galactic Empire

A browser-based space empire strategy game. Start with a single planet, extract resources, build infrastructure, raise a fleet, and conquer the galaxy.

## How to Play

1. **Manage Terra Prime** — Upgrade buildings to produce minerals, energy, and food each cycle.
2. **Build a Fleet** — Construct a Shipyard, then build scouts, frigates, destroyers, and carriers.
3. **Conquer Worlds** — Select enemy planets on the galaxy map and launch invasions.
4. **Win** — Unite all worlds under your empire.

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Game Mechanics

- **Resources**: Minerals, Energy, Food, Credits — produced by buildings each second.
- **Buildings**: Extraction Hub, Solar Array, Hydroponics, Shipyard, Planetary Shield, Command Center.
- **Ships**: Scout, Frigate, Destroyer, Carrier — each with different combat power.
- **Combat**: Fleet power vs planetary defense, with random variance.
- **Save**: Progress is automatically saved to your browser's local storage.

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management + persistence)
