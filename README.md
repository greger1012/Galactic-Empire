# Galactic Empire

A browser-based space empire strategy game. Start with a single planet, extract resources, build infrastructure, raise a fleet, and conquer the galaxy.

## How to Play

1. **Manage Terra Prime** — Upgrade buildings to produce minerals, energy, and food each cycle.
2. **Build a Fleet** — Construct a Shipyard, then build scouts, frigates, destroyers, and carriers.
3. **Deploy Ground Forces** — Launch a top-down tactical assault when invading enemy worlds.
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
- **Ground Combat**: Top-down tactical battles with animated legionnaire placeholders — select units, advance, auto-fire.
- **Combat**: Fleet power determines deployment size; planetary defense determines enemy troop count.
- **Planet Types**: 12 world types with specializations — farming, civilization, mining, industrial, and strategic dead worlds with unique resource bonuses and survivability.
- **Save**: Progress is automatically saved to your browser's local storage.

## Planet Types

| Type | Role | Highlights |
|------|------|------------|
| Terran | Balanced | Solid starter world |
| Oceanic / Jungle / Ice | Farming | High food output and population growth |
| Habitable | Civilization | Huge population caps and credit bonuses |
| Volcanic / Desert / Asteroid / Toxic / Crystalline | Mining | Rich minerals, harsh conditions |
| Gas Giant | Industrial | Best energy production |
| Barren | Strategic | Nearly dead, but controls trade routes for defense and credits |

Survivability affects food demand, population growth, and recovery after conquest. Strategic worlds like **Sentinel Drift** are barely habitable but grant powerful bonuses.

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management + persistence)
