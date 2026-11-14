import colors from "../../public/github-colors.json";

export type LanguageColor = { name: string; color: string };
const languages = Object.entries(colors)
  .filter(([, value]) => value.color)
  .map(([name, value]) => ({ name, color: value.color as string }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Lists standard GitHub language colors, optionally filtered by name. */
export const listLanguages = (query = "") => languages.filter((entry) => entry.name.toLowerCase().includes(query.toLowerCase()));

/** Looks up a standard language color, using gray for unknown languages. */
export const languageColor = (name: string) => languages.find((entry) => entry.name.toLowerCase() === name.toLowerCase())?.color ?? "#cccccc";

export const loadLanguages = async () => listLanguages();
