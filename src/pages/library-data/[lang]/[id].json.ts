// Détail d'un modèle de la bibliothèque, un fichier statique par modèle et par langue : /library-data/<langue>/<modèle>.json
// (voir src/lib/library.ts). Produit au build à partir de src/content/<langue>/_library.json (npm run sync).
import { langs } from "../../../lib/content";
import { detailModele, identifiantsModeles } from "../../../lib/library";
export const getStaticPaths = () => langs.flatMap((lang) => identifiantsModeles(lang).map((id) => ({ params: { lang, id } })));
export const GET = ({ params }: { params: { lang: string; id: string } }) =>
  new Response(JSON.stringify(detailModele(params.lang, params.id)), { headers: { "Content-Type": "application/json" } });
