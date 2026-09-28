# Ascendancy of Iron Suns

A browser-based space empire strategy game set during humanity's **Golden Age of innovation** — not a fallen age, and not salvaged relic-tech. Command the **Solar Ascendancy** from throne-world **Helios Prime**, extract **adamant** and **lumin**, direct the **Noosphere**, commission voidships, and bring contested mandates under a single throne law.

## How to Play

1. **Follow the First Mandate Briefing** — Raise a Noospheric Throne Node, build a Void Forge Annexe, commission voidships, assault a contested world, and begin research.
2. **Manage Helios Prime** — Upgrade infrastructure (Stratum Excavators, Helios Collectors, Vitae Domes, etc.) each mandate cycle.
3. **Build the Void Armada** — Commission Spectre Corvettes, Lance Frigates, and heavier hulls from the Void Forge.
4. **Mandate of Conquest** — **Tactical void battle** (move your armada, fight hostile interceptors, burn down the orbital aegis) after choosing doctrine, then top-down ground assaults (biomes, faction loadouts).
5. **Triumph (not game over)** — Annex the founding sector **or** fulfill **three Imperial Chronicle mandates** for a Mandate of Mastery. Either milestone unlocks a dismissible victory banner; the mandate cycle **keeps running**.
6. **Endless void frontiers** — When every contested world in the current sector falls, cartographers spawn the next **procedural wave** (scaled rivals, new names, stable map positions). Each wave includes a **Void Regent apex bastion** (wave boss).
7. **Deep void tiers** — Shallow → mid → deep → abyssal difficulty: higher aegis, more legions, and harsher faction pulses the farther you push.
8. **Void Frontier Chronicles** — Separate long goals (first horizon, apex hunter, deep void mandate, outer dominion) with sovereign mark rewards that do not count toward Mandate of Mastery.
9. **Survive rivals** — Faction pulses every 15 cycles (reinforcements, raids, embargoes).

## Getting Started

```bash
npm install
npm run dev
npm run test:e2e   # Playwright smoke test (builds + preview)
```

Open the URL shown in the terminal (usually `http://localhost:5173`). Use **New Mandate** to reset progress. Saves use browser local storage (`galactic-empire-save-v2`).

## Resources

| Internal key | In-game name |
|--------------|----------------|
| minerals | Adamant |
| energy | Lumin |
| food | Sustenance |
| credits | Sovereign Marks |

## Core Systems

- **Infrastructure** — Stratum Excavator, Helios Collector Array, Vitae Synthesis Dome, Void Forge Annexe, Aegis Pylon Network, Noospheric Throne Node.
- **Noospheric Research** — 13 technologies; insight per cycle scales with **Throne Node tiers** empire-wide.
- **Planet types** — 12 specializations (farming, mining, strategic chokepoints, etc.).
- **Rival mandates** — Kryll Forge-Clans, Vexar Synod, Zynthian Concord, Void Reavers; periodic pulses every 15 cycles.
- **Tactical combat (Pass II)** — Cover, suppression, grenades, **squad abilities** (suppress / lance volley / vitae stim), **faction-specific hostile AI**, apex boss tactics, procedural legion sprites.

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state + persistence)
