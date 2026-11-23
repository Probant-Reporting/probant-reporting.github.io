// Chargement des contenus : un dossier par langue dans src/content/, un fichier par thématique.
//   src/content/<langue>/_site.json   textes communs (menu, pied de page, contact, mentions, libellés de l'outil)
//   src/content/<langue>/<theme>.json une thématique (une page)
// Ajouter une langue = copier un dossier et le traduire. Ajouter une thématique = ajouter un fichier.
import config from "../../site.config.mjs";
import { typoDe } from "./typo.mjs";

const fichiers = import.meta.glob("../content/*/*.json", { eager: true, import: "default" }) as Record<string, any>;

function remplir<T>(v: T): T {
  if (typeof v === "string") return v.replaceAll("{name}", config.name) as T;
  if (Array.isArray(v)) return v.map(remplir) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, remplir(x)])) as T;
  return v;
}

type Langue = { site: any; themes: Record<string, any>; data: Record<string, any> };
const langues: Record<string, Langue> = {};
for (const [chemin, contenu] of Object.entries(fichiers)) {
  const [, lang, nom] = chemin.match(/content\/([^/]+)\/([^/]+)\.json$/)!;
  const typo = typoDe(lang); // espaces insécables du français : src/lib/typo.mjs
  langues[lang] ??= { site: null, themes: {}, data: {} };
  if (nom === "_site") langues[lang].site = remplir(typo(contenu));
  else if (nom.startsWith("_")) langues[lang].data[nom.slice(1)] = typo(contenu); // données synchronisées (_library.json…)
  else langues[lang].themes[nom] = remplir(typo(contenu));
}

export const defaultLang: string = config.defaultLang;
export const langs: string[] = Object.keys(langues)
  .filter((l) => langues[l].site)
  .sort((a, b) => (a === defaultLang ? -1 : b === defaultLang ? 1 : a.localeCompare(b)));

export const site = (lang: string) => langues[lang].site;
/** Données d'une langue (src/content/<langue>/_<nom>.json), celles de la langue par défaut si elles manquent. */
export const donnees = (lang: string, nom: string) => langues[lang]?.data[nom] ?? langues[config.defaultLang].data[nom];
/** Données propres à une langue, sans repli sur la langue par défaut (absentes : undefined). */
export const donneesPropres = (lang: string, nom: string) => langues[lang]?.data[nom];
export const themes = (lang: string): Record<string, any> => langues[lang].themes;
export const themeSlugs = (lang: string): string[] => {
  const s = Object.keys(langues[lang].themes);
  return s.sort((a, b) => (a === config.homeTheme ? -1 : b === config.homeTheme ? 1 : a.localeCompare(b)));
};
export const homeTheme = (lang: string): string =>
  langues[lang].themes[config.homeTheme] ? config.homeTheme : themeSlugs(lang)[0];

const base = config.base.endsWith("/") ? config.base : config.base + "/";
/** Adresse d'une page : chemin("contact", "fr") → /fr/contact/ ; la langue par défaut n'a pas de préfixe. */
export function chemin(page = "", lang = defaultLang): string {
  const parts = [lang === defaultLang ? "" : lang, page].filter(Boolean).join("/");
  return base + (parts ? parts + "/" : "");
}
export const fichier = (p: string) => base + p.replace(/^\//, "");
/** Flux RSS d'une langue : /rss.xml pour la langue par défaut, /<langue>/rss.xml pour les autres. */
export const fluxRss = (lang: string) => fichier(lang === defaultLang ? "rss.xml" : `${lang}/rss.xml`);
/** Code de langue et de pays pour og:locale (site.config.mjs, « locales ») : en → en_GB. */
export const locale = (lang: string): string => (config.locales as Record<string, string>)?.[lang] ?? lang;
export const absolu = (p: string) => config.url.replace(/\/$/, "") + p;
/** Adresse de la page d'une thématique (la thématique d'accueil est à la racine de la langue). */
export const cheminTheme = (slug: string, lang: string) => chemin(slug === homeTheme(lang) ? "" : slug, lang);

export { config };
