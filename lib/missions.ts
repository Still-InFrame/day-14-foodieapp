// The "mission" is the single axis the swap engine optimizes for. Everything
// else (UI copy, the live toggle, delta math) is driven off this config, so
// adding/removing a mission is a one-line change here.

export type MissionKey = "calories" | "sugar" | "nova" | "salt" | "protein" | "eco";

export interface Mission {
  key: MissionKey;
  label: string;
  short: string;
  emoji: string;
  unit: string;
  // "min": lower is better (calories, sugar...). "max": higher is better (protein, eco).
  direction: "min" | "max";
  // Smallest improvement we'll bother suggesting — keeps swaps feeling worth it.
  threshold: number;
  blurb: string;
}

export const MISSIONS: Record<MissionKey, Mission> = {
  calories: {
    key: "calories",
    label: "Fewer calories",
    short: "Calories",
    emoji: "🔥",
    unit: "kcal",
    direction: "min",
    threshold: 20,
    blurb: "Lighter versions of what you already eat.",
  },
  sugar: {
    key: "sugar",
    label: "Less sugar",
    short: "Sugar",
    emoji: "🍬",
    unit: "g",
    direction: "min",
    threshold: 1,
    blurb: "Cut hidden sugar without cutting the snack.",
  },
  nova: {
    key: "nova",
    label: "Less processed",
    short: "Processing",
    emoji: "🏭",
    unit: "NOVA",
    direction: "min",
    threshold: 1,
    blurb: "Trade ultra-processed for the real thing.",
  },
  salt: {
    key: "salt",
    label: "Less salt",
    short: "Salt",
    emoji: "🧂",
    unit: "g",
    direction: "min",
    threshold: 0.1,
    blurb: "Same flavor, less sodium.",
  },
  protein: {
    key: "protein",
    label: "More protein",
    short: "Protein",
    emoji: "💪",
    unit: "g",
    direction: "max",
    threshold: 2,
    blurb: "Get more protein per bite.",
  },
  eco: {
    key: "eco",
    label: "Lower eco-impact",
    short: "Eco",
    emoji: "🌍",
    unit: "pts",
    direction: "max",
    threshold: 5,
    blurb: "Kinder-to-the-planet alternatives.",
  },
};

export const MISSION_LIST: Mission[] = [
  MISSIONS.calories,
  MISSIONS.sugar,
  MISSIONS.nova,
  MISSIONS.salt,
  MISSIONS.protein,
  MISSIONS.eco,
];

export const DEFAULT_MISSION: MissionKey = "calories";

export function isMissionKey(value: string): value is MissionKey {
  return value in MISSIONS;
}
