// La liste des pages du site dans une langue : une seule source pour les adresses ([...path].astro), le plan du site
// (sitemap.xml) et les liens vers la même page dans une autre langue (hreflang, menu des langues).
import { langs, themeSlugs, homeTheme, donnees } from "./content";
import { pagesDe } from "./pages";

export type Route = { page: string; kind: string; slug?: string };
export function pagesDuSite(lang: string): Route[] {
  const pages: Route[] = [];
  for (const slug of themeSlugs(lang)) {
    const page = slug === homeTheme(lang) ? "" : slug;
    pages.push({ page, kind: "theme", slug });
    // la page « ce que l'outil ne fait pas » de la thématique
    pages.push({ page: [page, "limits"].filter(Boolean).join("/"), kind: "limits", slug });
  }
  for (const x of pagesDe("pages", lang)) pages.push({ page: x.slug, kind: "prose", slug: x.slug });
  pages.push({ page: "tour", kind: "tour" }, { page: "whats-new", kind: "whats-new" });
  pages.push({ page: "guides", kind: "guides-index" });
  for (const g of pagesDe("guides", lang)) pages.push({ page: `guides/${g.slug}`, kind: "guide", slug: g.slug });
  for (const d of pagesDe("docs", lang)) pages.push(d.slug === "index" ? { page: "docs", kind: "docs-index", slug: d.slug } : { page: `docs/${d.slug}`, kind: "doc", slug: d.slug });
  pages.push({ page: "frameworks", kind: "frameworks-index" });
  for (const m of donnees(lang, "library").templates) pages.push({ page: `frameworks/${m.slug}`, kind: "framework", slug: m.slug });
  for (const kind of ["contact", "legal", "privacy"]) pages.push({ page: kind, kind });
  return pages;
}
const adresses: Record<string, Set<string>> = Object.fromEntries(langs.map((l) => [l, new Set(pagesDuSite(l).map((p) => p.page))]));
/** Les langues qui ont cette page (la langue demandée en premier). */
export const languesDe = (page: string, lang: string): string[] => [lang, ...langs.filter((l) => l !== lang && adresses[l].has(page))];
