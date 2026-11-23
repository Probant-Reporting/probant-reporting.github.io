// Données de l'essai d'installation (accueil) : la liste légère des modèles (dans la page) et le détail d'un modèle
// (un fichier JSON par modèle et par langue, produit au build : src/pages/library-data/[lang]/[id].json.ts,
// chargé par src/scripts/installer.js quand la personne choisit un modèle).
import { donnees } from "./content";

const sources = (f: string) => [...new Set([...(f || "").matchAll(/\[([A-Z0-9-]+)(?:@[^\]]+)?\]/g)].map((m) => m[1]))];

/** Liste affichée au premier rendu : nom et descriptif (le nombre de KPI n'est pas affiché). */
export function listeModeles(lang: string) {
  const lib = donnees(lang, "library");
  return lib.templates.map((t: any) => ({ id: t.id, name: t.name, text: t.text }));
}

/** Détail d'un modèle : ses thèmes et, pour chaque KPI, type, unité, formule, sources de la formule et définition. */
export function detailModele(lang: string, id: string) {
  const lib = donnees(lang, "library");
  const t = lib.templates.find((x: any) => x.id === id);
  const kpi: Record<string, any> = {};
  for (const th of t.themes) for (const k of th.kpis) {
    const c = lib.catalogue[k.code] || {};
    kpi[k.code] = { n: k.name, t: c.type || "Input", u: c.unit || "", f: c.formula || "", s: sources(c.formula), d: c.definition || "" };
  }
  return { id: t.id, themes: t.themes.map((th: any) => ({ name: th.name, kpis: th.kpis.map((k: any) => k.code) })), kpi };
}

export const identifiantsModeles = (lang: string): string[] => donnees(lang, "library").templates.map((t: any) => t.id);
