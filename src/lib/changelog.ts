// Les versions de l'outil : src/content/<langue>/_changelog.json, fabriqué par `npm run sync` à partir du
// CHANGELOG.md de l'outil. Une seule source pour la page « What's new » et pour le flux RSS.
import { donnees, donneesPropres, defaultLang, config } from "./content";

export type Version = { version: string; date: string; sections: { title: string; items: string[] }[]; lang?: string };
/** Les versions dans une langue. Dans la langue par défaut : le fichier fabriqué par `npm run sync`. Dans une autre
 *  langue : les mêmes versions, avec le texte du fichier de traduction tenu dans le site (_changelog.json de la
 *  langue, une entrée par version) ; une version qui n'y est pas encore reste dans la langue par défaut (« lang »
 *  le dit à la page, et `npm run check` le signale). */
export const versions = (lang: string): Version[] => {
  const source: Version[] = donnees(defaultLang, "changelog").entries;
  if (lang === defaultLang) return source.map((v) => ({ ...v, lang }));
  const traduites: Version[] = donneesPropres(lang, "changelog")?.entries ?? [];
  return source.map((v) => { const t = traduites.find((x) => x.version === v.version); return t ? { ...v, sections: t.sections, lang } : { ...v, lang: defaultLang }; });
};
/** Ancre d'une version dans la page : 1.0.0 → v1-0-0. */
export const ancre = (v: string) => "v" + v.replace(/[^0-9a-z]+/gi, "-");

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Markdown d'une ligne → HTML sûr : **gras**, `code`, [lien](https://… ou /page/). Tout le reste est échappé. */
export function enLigne(md: string, lien: (u: string) => string = (u) => u): string {
  return echapper(md.replaceAll("{name}", config.name))
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(((?:https:\/\/|\/)[^)\s]*)\)/g, (_, t, u) => `<a href="${lien(u)}">${t}</a>`);
}
/** Date d'une version, écrite en toutes lettres (23 November 2026). */
export const dateLongue = (iso: string, lang: string) => new Date(iso + "T12:00:00Z").toLocaleDateString(lang === "en" ? "en-GB" : lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
