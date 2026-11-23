// Flux RSS des versions de l'outil dans une langue : la même source que la page des versions (src/lib/changelog.ts).
// Un flux par langue : /rss.xml pour la langue par défaut, /<langue>/rss.xml pour les autres.
import { site, chemin, absolu, fluxRss, config } from "./content";
import { versions, ancre, enLigne } from "./changelog";
const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function flux(lang: string): Response {
  const w = site(lang).whatsNew;
  const page = absolu(chemin("whats-new", lang));
  const lien = (u: string) => (u.startsWith("/") ? absolu(chemin(u.replace(/^\/|\/$/g, ""), lang)) : u);
  const items = versions(lang).map((v) => {
    const html = v.sections.map((s) => `${s.title ? `<h3>${x(s.title)}</h3>` : ""}<ul>${s.items.map((i) => `<li>${enLigne(i, lien)}</li>`).join("")}</ul>`).join("");
    return `    <item>\n      <title>${x(`${config.name} ${v.version}`)}</title>\n      <link>${page}#${ancre(v.version)}</link>\n      <guid isPermaLink="false">${x(`${config.name.toLowerCase()}-${v.version}${lang === config.defaultLang ? "" : `-${lang}`}`)}</guid>\n      <pubDate>${new Date(v.date + "T09:00:00Z").toUTCString()}</pubDate>\n      <description><![CDATA[${html.replaceAll("]]>", "]]&gt;")}]]></description>\n    </item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${x(w.meta.title)}</title>\n    <link>${page}</link>\n    <description>${x(w.meta.description)}</description>\n    <language>${lang}</language>\n    <atom:link href="${absolu(fluxRss(lang))}" rel="self" type="application/rss+xml" />\n${items.join("\n")}\n  </channel>\n</rss>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
