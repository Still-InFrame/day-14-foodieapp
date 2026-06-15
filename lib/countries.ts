// Country preference for swap results. `slug` is the Open Food Facts country tag
// slug used in the CGI search filter; "" means no filter (search everywhere).
export interface Country {
  slug: string;
  label: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { slug: "united-states", label: "United States", flag: "🇺🇸" },
  { slug: "united-kingdom", label: "United Kingdom", flag: "🇬🇧" },
  { slug: "canada", label: "Canada", flag: "🇨🇦" },
  { slug: "australia", label: "Australia", flag: "🇦🇺" },
  { slug: "ireland", label: "Ireland", flag: "🇮🇪" },
  { slug: "france", label: "France", flag: "🇫🇷" },
  { slug: "spain", label: "Spain", flag: "🇪🇸" },
  { slug: "germany", label: "Germany", flag: "🇩🇪" },
  { slug: "italy", label: "Italy", flag: "🇮🇹" },
  { slug: "", label: "Everywhere", flag: "🌍" },
];

export const DEFAULT_COUNTRY = "united-states";

export function isCountrySlug(slug: string): boolean {
  return COUNTRIES.some((c) => c.slug === slug);
}

export function countryLabel(slug: string): string {
  return COUNTRIES.find((c) => c.slug === slug)?.label ?? "Everywhere";
}

export function countryFlag(slug: string): string {
  return COUNTRIES.find((c) => c.slug === slug)?.flag ?? "🌍";
}
