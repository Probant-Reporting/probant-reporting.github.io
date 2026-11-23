// Données FICTIVES de la démonstration (groupe inventé « Halden Group »), partagées par les pages et par l'essai.
// Les trois KPI saisis sont de vrais KPI du modèle VS Base de l'outil (docs/library.md) : NRJ-ELEC, NRJ-ELEC-REN, SOC-EFFECTIF.
export const LIGNES = [
  { id: "group", niveau: "groupe", rang: 0, sites: ["lyon", "nantes", "valencia", "bilbao"] },
  { id: "fr", niveau: "pays", rang: 1, sites: ["lyon", "nantes"] },
  { id: "lyon", niveau: "site", rang: 2, sites: ["lyon"] },
  { id: "nantes", niveau: "site", rang: 2, sites: ["nantes"] },
  { id: "es", niveau: "pays", rang: 1, sites: ["valencia", "bilbao"] },
  { id: "valencia", niveau: "site", rang: 2, sites: ["valencia"] },
  { id: "bilbao", niveau: "site", rang: 2, sites: ["bilbao"] },
];
export const SITES = ["lyon", "nantes", "valencia", "bilbao"];
export const NIVEAU_LIBELLE = { groupe: "group", pays: "country", site: "site" };
export const KPIS = {
  elec: { code: "NRJ-ELEC", preuve: true },
  ren: { code: "NRJ-ELEC-REN" },
  head: { code: "SOC-EFFECTIF" },
};
export const SAISIS = ["elec", "ren", "head"];
export const N1 = {
  lyon: { elec: 428900, ren: 150100, head: 338 },
  nantes: { elec: 179200, ren: 89600, head: 91 },
  valencia: { elec: 351600, ren: 228500, head: 286 },
  bilbao: { elec: 61050, ren: 30525, head: 39 },
};
// État de départ de l'essai : v = valeur, s = statut (todo, draft, validated), c = commentaire, f = preuves (noms)
export const DEPART = {
  lyon: { elec: { v: null, s: "todo" }, ren: { v: 164920, s: "draft" }, head: { v: 342, s: "validated" } },
  nantes: { elec: { v: 186450, s: "validated", f: ["invoices-production-site-2026.pdf"] }, ren: { v: 93225, s: "validated" }, head: { v: 96, s: "validated" } },
  valencia: { elec: { v: 367800, s: "validated", f: ["facturas-oficina-comercial-2026.pdf"] }, ren: { v: 257460, s: "validated" }, head: { v: 352, s: "draft" } },
  bilbao: { elec: { v: 58240, s: "validated", f: ["facturas-centro-servicios-2026.pdf"] }, ren: { v: 42000, s: "validated", c: true, f: ["contrato-renovable-2026.pdf"] }, head: { v: null, s: "todo" } },
};
// État « tout est fait » du haut de page et des illustrations
export const COMPLET = {
  lyon: { elec: 412300, ren: 164920, head: 342 },
  nantes: { elec: 186450, ren: 93225, head: 96 },
  valencia: { elec: 367800, ren: 257460, head: 280 },
  bilbao: { elec: 58240, ren: 42000, head: 41 },
};
export const SEUIL = 0.2; // commentaire demandé au-delà de 20 % d'écart avec N-1

export const somme = (valeurs) => (valeurs.some((v) => v == null) ? null : valeurs.reduce((a, b) => a + b, 0));
export const sommePartielle = (valeurs) => valeurs.filter((v) => v != null).reduce((a, b) => a + b, 0);
export const ecart = (v, n1) => (v == null || !n1 ? null : (v - n1) / n1);
export const nombre = (v, lang = "en") => (v == null ? "–" : new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(v));
export const pourcent = (r, lang = "en", decimales = 1) =>
  r == null ? "–" : new Intl.NumberFormat(lang, { style: "percent", minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(r);
export const ecartTexte = (r, lang = "en") =>
  r == null ? "–" : (r > 0 ? "+" : "") + pourcent(r, lang, 1);
export const fleche = (r) => (r == null || r === 0 ? "" : r > 0 ? "▲" : "▼");
