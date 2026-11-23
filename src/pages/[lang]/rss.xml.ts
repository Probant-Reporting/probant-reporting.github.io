// Flux RSS des versions de l'outil dans chaque langue autre que la langue par défaut : /fr/rss.xml (src/lib/rss.ts).
import { langs, defaultLang } from "../../lib/content";
import { flux } from "../../lib/rss";
export const getStaticPaths = () => langs.filter((l) => l !== defaultLang).map((lang) => ({ params: { lang } }));
export const GET = ({ params }: { params: { lang: string } }) => flux(params.lang);
