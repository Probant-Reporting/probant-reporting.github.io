// Typographie française, appliquée aux textes français au moment de fabriquer le site : les fichiers de contenu
// s'écrivent avec des espaces ordinaires, comme on les tape (« Une question ? », 1 280 px, 20 %), et le site pose
// l'espace insécable là où le français la demande. Ainsi « : », « ; », « ! », « ? », « » » et « % » ne passent jamais
// seuls à la ligne, et un nombre ne se coupe pas entre ses milliers.
//   - espace insécable avant : ; ! ? » et après « ;
//   - espace fine insécable entre les milliers (1 280), comme l'écrit Intl.NumberFormat("fr") dans l'essai ;
//   - espace insécable entre un nombre et son unité (%, €, Mo, px, kWh…).
// Ce qui est entre accents graves (`code`) n'est pas touché. La fonction ne change rien à un texte déjà traité.
const INSECABLE = " ", FINE = " ";
const UNITES = "%|€|Mo|Go|Ko|px|kWh|MWh|m³|tCO2e";
function hors(texte) {
  return texte
    .replace(/ ([:;!?])(?=[\s<"'»)\]…]|$)/g, `${INSECABLE}$1`)
    .replace(/« /g, `«${INSECABLE}`).replace(/ »/g, `${INSECABLE}»`)
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${FINE}`)
    .replace(new RegExp(`(\\d) (?=(?:${UNITES})(?![\\p{L}\\p{N}]))`, "gu"), `$1${INSECABLE}`);
}
/** Un texte français, avec ses espaces insécables. Le code entre accents graves reste tel quel. */
export const typoFr = (texte) => (typeof texte === "string" ? texte.split(/(`[^`]*`)/).map((m, i) => (i % 2 ? m : hors(m))).join("") : texte);
// Clés dont la valeur n'est pas un texte à lire : codes, adresses, formules, empreintes.
const TECHNIQUES = new Set(["code", "id", "slug", "img", "anchor", "formula", "type", "sourceHash", "visual"]);
/** Tous les textes d'un objet (fichier de contenu), sauf les valeurs techniques. */
export function typoFrProfond(v, cle = "") {
  if (typeof v === "string") return TECHNIQUES.has(cle) ? v : typoFr(v);
  if (Array.isArray(v)) return v.map((x) => typoFrProfond(x, cle));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typoFrProfond(x, k)]));
  return v;
}
/** La typographie d'une langue : le français a la sienne, les autres langues gardent leur texte. */
export const typoDe = (lang) => (lang === "fr" ? typoFrProfond : (v) => v);
