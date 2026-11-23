// Flux RSS des versions de l'outil, dans la langue par défaut (src/lib/rss.ts). Les autres langues : [lang]/rss.xml.ts.
import { defaultLang } from "../lib/content";
import { flux } from "../lib/rss";
export const GET = () => flux(defaultLang);
