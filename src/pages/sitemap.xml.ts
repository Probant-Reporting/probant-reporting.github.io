// Plan du site pour les moteurs de recherche, calculé à partir des fichiers de contenu : toutes les pages de toutes
// les langues. Chaque page cite ses versions dans les autres langues (xhtml:link hreflang) ; x-default désigne la
// langue par défaut.
import { langs, chemin, absolu, defaultLang } from "../lib/content";
import { pagesDuSite, languesDe } from "../lib/routes";
export function GET() {
  const urls: string[] = [];
  for (const lang of langs) for (const { page } of pagesDuSite(lang)) {
    const versions = languesDe(page, lang);
    const codes = versions.length > 1 ? [...versions.map((l) => [l, l]), ...(versions.includes(defaultLang) ? [["x-default", defaultLang]] : [])] : [];
    const liens = codes.map(([code, l]) => `<xhtml:link rel="alternate" hreflang="${code}" href="${absolu(chemin(page, l))}"/>`).join("");
    urls.push(`  <url><loc>${absolu(chemin(page, lang))}</loc>${liens}</url>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
