import { absolu, fichier } from "../lib/content";
export const GET = () => new Response(`User-agent: *\nAllow: /\nSitemap: ${absolu(fichier("sitemap.xml"))}\n`, { headers: { "Content-Type": "text/plain" } });
