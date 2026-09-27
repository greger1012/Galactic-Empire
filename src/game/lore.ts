import type { ResourceType } from './types'

/** Display names for the Solar Ascendancy setting — humanity in a living golden age of invention. */
export const LORE = {
  gameTitle: 'Ascendancy of Iron Suns',
  gameSubtitle: 'Golden Age of Innovation · Mandate 11,402',

  empireDefaultName: 'Solar Ascendancy',
  empireTitle: 'Throne Mandate',

  homePlanetName: 'Helios Prime',
  homePlanetTagline: 'Cradle of the Second Dawn',

  cycleLabel: 'Mandate Cycle',
  chronicleTitle: 'Noospheric Ledger',
  galaxyMapTitle: 'Stellar Cartograph',
  fleetTitle: 'Void Armada Command',
  infrastructureTitle: 'Planetary Infrastructure',

  victoryTitle: 'Mandate Fulfilled',
  victoryMessage:
    'The fractured void kneels before the Iron Suns. A new chapter of the Golden Age begins.',

  resourceLabels: {
    minerals: 'Adamant',
    energy: 'Lumin',
    food: 'Sustenance',
    credits: 'Sovereign Marks',
  } satisfies Record<ResourceType, string>,

  resourceDescriptions: {
    minerals: 'Strata ore and refined adamant from planetary cores',
    energy: 'Voltaic charge harvested from stellar collectors',
    food: 'Biomass and nutrient paste for void-populations',
    credits: 'Throne-minted marks of imperial commerce',
  } satisfies Record<ResourceType, string>,

  ownership: {
    player: 'Throne Holdings',
    enemy: 'Contested Domain',
  },

  battle: {
    assaultTitle: 'Mandate Ground Assault',
    assaultSubtitle: 'Ascendancy legions engage planetary hostiles',
    legionLabel: 'Legionnaires',
    hostilesLabel: 'Hostiles',
    victory: 'Mandate Secured',
    victoryMessage: 'The world is annexed under Throne law.',
    defeat: 'Mandate Broken',
    defeatMessage: 'The assault cadre has been annihilated.',
    retreat: 'Strategic Withdrawal',
  },
} as const

export interface FactionLore {
  id: string
  name: string
  shortName: string
  motto: string
  description: string
  color: string
  aggression: number
}

export const FACTION_LORE: FactionLore[] = [
  {
    id: 'kryll',
    name: 'Kryll Forge-Clans',
    shortName: 'Kryll',
    motto: 'Iron remembers. Fire endures.',
    description:
      'Militant industrial houses that guard their own forge-patents and refuse Throne sovereignty.',
    color: '#b83a2a',
    aggression: 0.7,
  },
  {
    id: 'vexar',
    name: 'Vexar Synod',
    shortName: 'Vexar',
    motto: 'Flesh is temporary. The circuit is eternal.',
    description:
      'Machine-augmented theocrats who believe consciousness must merge with the Noosphere.',
    color: '#7b4fa3',
    aggression: 0.5,
  },
  {
    id: 'zynthian',
    name: 'Zynthian Concord',
    shortName: 'Zynthian',
    motto: 'Life perfected cannot be denied.',
    description:
      'Bio-engineered utopians who believe the Ascendancy clings to an outdated vision of humanity.',
    color: '#3d8f5f',
    aggression: 0.4,
  },
  {
    id: 'pirates',
    name: 'Void Reavers',
    shortName: 'Reavers',
    motto: 'The frontier belongs to whoever holds it.',
    description:
      'Freebooter fleets and exile syndicates raiding the unpoliced fringes of the expanding void.',
    color: '#c47f1a',
    aggression: 0.8,
  },
]

export function getFactionLore(factionId: string): FactionLore | undefined {
  return FACTION_LORE.find((f) => f.id === factionId)
}

export const OPENING_CHRONICLE =
  'Mandate transmitted. You are named Warden of Helios Prime, throne-world of the Solar Ascendancy. ' +
  'Raise cutting-edge infrastructure, commission void warships, and bring the contested stars under a single mandate.'

export const WIN_CHRONICLE =
  'Mandate absolute. Every contested world now flies the Iron Sun banner. ' +
  'Historians will call this the Second Dawn — the moment the Ascendancy became the Galaxy.'
