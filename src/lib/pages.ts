// Pages en Markdown : src/content/<langue>/pages/*.md (pages de contenu), guides/*.md (un par rôle),
// docs/*.md (documentation technique, synchronisée depuis le dépôt de l'outil : npm run sync, ne pas modifier à la main).
// Ajouter une page = ajouter un fichier .md avec son en-tête (title, description, order, group).
import config from "../../site.config.mjs";
import { typoDe } from "./typo.mjs";

const fichiers = import.meta.glob("../content/*/{pages,guides,docs}/*.md", { eager: true }) as Record<string, any>;
export type Page = { slug: string; kind: string; lang: string; fm: any; Content: any; headings: { depth: number; slug: string; text: string }[] };
const tout: Page[] = Object.entries(fichiers).map(([chemin, m]) => {
  const [, lang, kind, slug] = chemin.match(/content\/([^/]+)\/([^/]+)\/([^/]+)\.md$/)!;
  return { slug, kind, lang, fm: typoDe(lang)(m.frontmatter), Content: m.Content, headings: m.getHeadings() }; // en-tête : espaces insécables du français
});
/** Les pages d'un type (pages, guides, docs) dans une langue, rangées par « order ». */
export const pagesDe = (kind: string, lang: string) => tout.filter((p) => p.kind === kind && p.lang === lang).sort((a, b) => (a.fm.order ?? 99) - (b.fm.order ?? 99));
/** {name} → nom du produit, dans les titres et descriptions des en-têtes. */
export const nom = (s: string = "") => s.replaceAll("{name}", config.name);
/** Un titre affiché : jamais de tiret en début de ligne, jamais un mot seul sur la dernière ligne (trois mots ou plus,
 *  et seulement si les deux derniers mots tiennent ensemble sur un petit écran : 16 caractères au plus). */
export const titre = (s: string = "") => {
  const t = nom(s).replace(/ ([–—]) /g, "\u00A0$1 ");
  const mots = t.split(" ");
  return mots.length > 2 && mots.slice(-2).join(" ").length <= 16 ? t.replace(/ (\S+)$/, "\u00A0$1") : t;
};
