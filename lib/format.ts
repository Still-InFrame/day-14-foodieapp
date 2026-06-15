import { MISSIONS, type MissionKey } from "./missions";

// How many decimals each mission's numbers get. Counts/scores are whole;
// grams (sugar/salt/protein) read better with one decimal.
function decimals(mission: MissionKey): number {
  return mission === "calories" || mission === "eco" || mission === "nova" ? 0 : 1;
}

// A product's value on a mission, human-readable ("42 kcal", "NOVA 4", "65/100").
export function fmtValue(mission: MissionKey, value: number | null): string {
  if (value == null) return "—";
  const n = value.toFixed(decimals(mission));
  switch (mission) {
    case "calories":
      return `${n} kcal`;
    case "sugar":
    case "salt":
    case "protein":
      return `${n} g`;
    case "nova":
      return `NOVA ${n}`;
    case "eco":
      return `${n}/100`;
  }
}

// A swap's improvement as a signed badge ("−41 kcal", "+11 g", "−2 NOVA").
// `delta` is always the positive improvement; the sign comes from direction.
export function fmtDelta(mission: MissionKey, delta: number): string {
  const sign = MISSIONS[mission].direction === "min" ? "−" : "+";
  const n = Math.abs(delta).toFixed(decimals(mission));
  switch (mission) {
    case "calories":
      return `${sign}${n} kcal`;
    case "sugar":
    case "salt":
    case "protein":
      return `${sign}${n} g`;
    case "nova":
      return `${sign}${n} NOVA`;
    case "eco":
      return `${sign}${n} pts`;
  }
}
