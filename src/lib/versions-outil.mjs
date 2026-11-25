// Les notes de version de l'outil (CHANGELOG.md de son dépôt) → src/content/en/_changelog.json, lu par la page
// « What's new » et le flux RSS (src/lib/changelog.ts).
//
// Deux usages :
//   - `npm run versions` (et la mise en ligne, .github/workflows/deploy.yml, à chaque envoi et chaque jour) : relit le
//     CHANGELOG.md du dépôt public de l'outil (site.config.mjs, repo), branche main, qui ne reçoit que des versions
//     publiées. Une nouvelle version de l'outil paraît donc sur le site sans rien faire. Sans réseau, ou si le fichier
//     est illisible, le fichier du site est gardé tel quel et la commande le dit, sans échouer.
//   - `npm run sync` dans l'atelier (lireVersions, sur le CHANGELOG.md d'une copie de l'outil).
// Une version pas encore traduite s'affiche dans la langue par défaut, avec une note ; la traduction se fait dans
// src/content/<langue>/_changelog.json (npm run sync dit ce qui manque).
//
// Structure attendue :  ## 1.0.0 — 2026-11-23   puis   ### Highlights / ### For IT / ### Security   puis des listes « - ».
// Un paragraphe sous un titre devient une ligne ; une ligne de liste qui continue à la ligne suivante est recollée.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

export function lireVersions(md) {
  const entrees = []; let entree = null, section = null;
  const ligne = (t) => { if (!entree) return; if (!section) entree.sections.push((section = { title: "", items: [] })); section.items.push(t); };
  for (const brut of md.split("\n")) {
    const l = brut.trimEnd();
    const v = l.match(/^##\s+\[?v?(\d+\.\d+(?:\.\d+)?[^\]\s]*)\]?\s*(?:[—–-]+\s*(\d{4}-\d{2}-\d{2}))?/);
    if (v) { entrees.push((entree = { version: v[1], date: v[2] || "", sections: [] })); section = null; continue; }
    if (/^##\s/.test(l)) { entree = null; section = null; continue; } // « ## Unreleased » et autres titres : pas une version
    if (!entree) continue;
    const t = l.match(/^###\s+(.+)/);
    if (t) { entree.sections.push((section = { title: t[1].trim(), items: [] })); continue; }
    const p = l.match(/^\s*[-*]\s+(.+)/);
    if (p) { ligne(p[1].trim()); continue; }
    if (!l.trim()) continue;
    if (section && section.items.length && /^\s+\S/.test(l)) section.items[section.items.length - 1] += " " + l.trim(); // suite d'une ligne de liste
    else if (!/^#/.test(l)) ligne(l.trim());
  }
  for (const e of entrees) e.sections = e.sections.filter((x) => x.items.length).map(({ title, items }) => ({ title, items }));
  return entrees.filter((e) => e.sections.length);
}

/** Une erreur lisible si les versions lues ne conviennent pas, sinon "". */
export function defautVersions(entrees) {
  if (!entrees.length) return "aucune version lue (attendu : « ## 1.0.0 — 2026-11-23 »)";
  const sansDate = entrees.filter((e) => !/^\d{4}-\d{2}-\d{2}$/.test(e.date)).map((e) => e.version);
  return sansDate.length ? `version(s) sans date : ${sansDate.join(", ")}` : "";
}

// ── npm run versions ─────────────────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const { default: config } = await import(join(SITE, "site.config.mjs"));
  const [, proprietaire, depot] = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(config.repo) || [];
  const adresse = `https://raw.githubusercontent.com/${proprietaire}/${depot}/main/CHANGELOG.md`;
  const fichier = join(SITE, "src/content/en/_changelog.json");
  let md = "";
  try {
    const r = await fetch(adresse, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    md = await r.text();
  } catch (e) {
    console.log(`Versions : ${adresse} illisible (${e.message}) ; ${fichier} est gardé tel quel.`);
    process.exit(0);
  }
  const entrees = lireVersions(md), defaut = defautVersions(entrees);
  if (defaut) { console.log(`Versions : CHANGELOG.md public, ${defaut} ; ${fichier} est gardé tel quel.`); process.exit(0); }
  const avant = existsSync(fichier) ? readFileSync(fichier, "utf8") : "";
  const apres = JSON.stringify({ source: "CHANGELOG.md", entries: entrees }, null, 2) + "\n";
  if (avant === apres) console.log(`Versions : à jour (${entrees.map((e) => e.version).join(", ")}).`);
  else { writeFileSync(fichier, apres); console.log(`Versions : ${entrees.map((e) => e.version).join(", ")} (fichier mis à jour depuis le dépôt public).`); }
  for (const lang of readdirSync(join(SITE, "src/content")).filter((l) => l !== config.defaultLang)) {
    const f = join(SITE, "src/content", lang, "_changelog.json");
    const traduites = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).entries || [] : [];
    const manquantes = entrees.filter((v) => !traduites.some((t) => t.version === v.version)).map((v) => v.version);
    if (manquantes.length) console.log(`Versions (${lang}) : ${manquantes.join(", ")} pas encore traduite(s) : affichée(s) en anglais, avec une note.`);
  }
}
