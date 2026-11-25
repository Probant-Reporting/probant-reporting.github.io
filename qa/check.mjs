// Contrôles avant mise en ligne, sur le site construit (dist/). Usage : npm run build && npm run check
// 1. rien à compléter dans site.config.mjs ; 2. aucune affirmation interdite ; 3. tous les liens internes existent
// (pages, images, ancres) ; 4. chaque langue a les mêmes fichiers et les mêmes clés que la langue par défaut ;
// 5. chaque langue a les mêmes pages, chaque page cite ses versions dans les autres langues et ces liens existent ;
// 6. une page française n'a pas de texte anglais resté là (liste de mots), ni d'espace ordinaire avant : ; ! ? ;
// 7. chaque version des notes de version a sa traduction dans chaque langue.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import config from "../site.config.mjs";
let erreurs = 0, avertissements = 0;
const ko = (m) => { erreurs++; console.log("ERROR  ", m); };
const attention = (m) => { avertissements++; console.log("WARNING", m); };

// 1. configuration
for (const [k, v] of Object.entries({ linkedin: config.linkedin, contactEmail: config.contactEmail, url: config.url, ...config.publisher }))
  if (v && /\[|\.example/.test(v)) attention(`site.config.mjs: "${k}" is still a placeholder (${v}). Complete it before going live.`);

// langues du site : un dossier par langue dans src/content/, la langue par défaut à la racine du site
const dossier = "src/content", ref = config.defaultLang;
const langues = readdirSync(dossier).filter((l) => existsSync(join(dossier, l, "_site.json")));
const autres = langues.filter((l) => l !== ref);
const sansBase = (href) => href.replace(config.base === "/" ? /^\// : new RegExp("^" + config.base), "");
const fichierDe = (href) => { const cible = join("dist", sansBase(href)); return existsSync(cible) && statSync(cible).isFile() ? cible : existsSync(join(cible, "index.html")) ? join(cible, "index.html") : null; };
// langue d'une page construite : dist/<langue>/… pour les autres langues, le reste pour la langue par défaut
const langueDe = (p) => autres.find((l) => p.split(/[\\/]/)[1] === l) || ref;

// 2. affirmations interdites (brief, section 2)
// noms à ne jamais citer : donnés hors du dépôt, par exemple FORBIDDEN_NAMES="Nom1,Nom2" npm run check
const noms = (process.env.FORBIDDEN_NAMES || "").split(",").map((n) => n.trim()).filter(Boolean).map((n) => new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
// formulations propres à l'atelier de développement : dans un fichier à part, absent d'une copie publiée du site
let atelier = [];
if (existsSync(new URL("./check.workshop.mjs", import.meta.url))) atelier = (await import("./check.workshop.mjs")).default;
const interdits = [...noms, ...atelier, /CSRD[- ]compliant/i, /compliant with (the )?CSRD/i, /conforme (à la )?CSRD/i, /certified carbon(?! accounting software)/i, /AI-powered/i, /revolutionary/i, /(certified|validated|approved) by EFRAG/i, /EFRAG[- ](certified|validated|approved)/i,
  // les mêmes affirmations en français
  /conforme (à|aux) (la |l')?(CSRD|ESRS)/i, /(certifié|validé|approuvé|homologué)e?s? par l'EFRAG/i, /révolutionnaire/i, /propulsé par l'IA/i, /demande[rz]? une démo/i];
const pages = [];
(function lister(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? lister(p) : p.endsWith(".html") && pages.push(p); } })("dist");
const htmlDe = {}, ancresDe = {};
for (const p of pages) { htmlDe[p] = readFileSync(p, "utf8"); ancresDe[p] = new Set([...htmlDe[p].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])); }
// une page de renvoi (ancienne adresse de la documentation IT, src/components/Redirection.astro) : seule sa cible est
// contrôlée (la page et l'ancre existent) ; elle ne compte ni comme page ni dans le plan du site
const renvois = pages.filter((p) => /<meta http-equiv="refresh"/.test(htmlDe[p]));
for (const p of renvois) {
  const m = /<meta http-equiv="refresh" content="0; url=(\/[^"#]*)(?:#([^"]*))?"/.exec(htmlDe[p]);
  const cible = m && fichierDe(m[1]);
  if (!cible) ko(`${p}: redirect without a page`);
  else if (m[2] && !ancresDe[cible]?.has(m[2])) ko(`${p}: redirect to a missing anchor #${m[2]}`);
  if (!/<meta name="robots" content="noindex"/.test(htmlDe[p])) ko(`${p}: redirect page without noindex`);
}
pages.splice(0, pages.length, ...pages.filter((p) => !renvois.includes(p)));
// deux éléments ne portent jamais le même id (ancres, libellés des champs)
for (const p of pages) { const vus = new Set(), doubles = new Set(); for (const [, id] of htmlDe[p].matchAll(/\sid="([^"]+)"/g)) (vus.has(id) ? doubles : vus).add(id); if (doubles.size) ko(`${p}: id used twice (${[...doubles].slice(0, 5).join(", ")})`); }

// 6. texte anglais resté dans une page française : une liste de mots anglais courants, cherchés dans le texte lu (hors
// code, hors parties déclarées dans une autre langue par lang="…"). Un texte anglais voulu (message de l'outil cité
// dans la documentation, nom d'un menu de GitHub) s'ajoute ici, mot pour mot.
// (limites de mot qui connaissent les lettres accentuées : « Forêt » ne contient pas le mot anglais « for »)
const MOTS_ANGLAIS = /(?<![\p{L}\p{N}_])(the|and|with|your|you|this|these|those|from|which|when|what|how|are|was|were|for|not|can|have|has|will|its|their|they|then|also|each|every|must|should|of)(?![\p{L}\p{N}_])/giu;
const ANGLAIS_PERMIS = ["SIL Open Font License", "GNU Affero General Public License", "Watch › Custom › Releases"];
// La documentation IT cite entre guillemets des messages que l'outil ou Git affichent en anglais : dans ces pages,
// ce qui est entre « » n'est pas contrôlé.
const CITATIONS = /«[^»]{0,400}»/g;
const decoder = (t) => t.replace(/&nbsp;|&#160;|&#xa0;/gi, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
function texteLu(html, lang) {
  let t = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>|<kbd[\s\S]*?<\/kbd>/gi, " ");
  // une partie déclarée dans une autre langue (menu des langues, liste gardée en anglais) n'est pas du texte de cette langue
  t = t.replace(new RegExp(`<(\\w+)\\b(?=[^>]*\\slang="(?!${lang}")[^"]*")[^>]*>[\\s\\S]*?<\\/\\1>`, "g"), " ");
  const attributs = [...t.matchAll(/\s(?:alt|aria-label|title|placeholder|content)="([^"]*)"/g)].map((m) => m[1]).filter((v) => !/^(https?:|width=|#|[a-z_]+$)/i.test(v));
  return decoder(`${t.replace(/<[^>]+>/g, " ")} ${attributs.join(" ")}`).replace(/[ \t\r\n]+/g, " ");
}

for (const p of pages) {
  const html = htmlDe[p], lang = langueDe(p), introuvable = /[\\/]404\.html$/.test(p);
  for (const r of interdits) if (r.test(html)) ko(`${p}: forbidden wording ${r}`);
  // 3. liens internes : la page existe, et son ancre aussi
  for (const [, href, ancre] of html.matchAll(/href="(\/[^"#?]*)(?:#([^"]*))?"/g)) {
    const cible = fichierDe(href);
    if (!cible) { ko(`${p}: broken link ${href}`); continue; }
    if (ancre && cible.endsWith(".html")) { let a = ancre; try { a = decodeURIComponent(ancre); } catch { /* ancre gardée telle quelle */ } if (!ancresDe[cible]?.has(a)) ko(`${p}: broken anchor ${href}#${a}`); }
  }
  for (const [, ancre] of html.matchAll(/href="#([^"]+)"/g)) { let a = ancre; try { a = decodeURIComponent(ancre); } catch { /* idem */ } if (!ancresDe[p].has(a)) ko(`${p}: broken anchor #${a}`); }
  for (const [, src] of html.matchAll(/<img[^>]+src="(\/[^"]+)"/g)) if (!existsSync(join("dist", sansBase(src)))) ko(`${p}: missing image ${src}`);
  for (const [img] of html.matchAll(/<img[^>]*>/g)) if (!/ alt="[^"]{20,}"/.test(img)) ko(`${p}: image without a real text alternative`);
  if (!/<h1[\s>]/.test(html)) ko(`${p}: no h1`);
  for (const [m] of html.matchAll(/\[[^\]<]{0,80}(?:to complete|à compléter)[^\]<]{0,120}\]/gi)) attention(`${p}: text still to complete ${m}`);
  if (!/<meta name="description" content="[^"]{20,}/.test(html)) ko(`${p}: no description`);
  if (introuvable) { for (const l of autres) if (!new RegExp(`<section[^>]*\\slang="${l}"`).test(html)) ko(`${p}: the page does not offer the language "${l}"`); continue; }
  // 5. langue déclarée, et liens vers la même page dans les autres langues (hreflang, x-default)
  if (!new RegExp(`<html[^>]*\\slang="${lang}"`).test(html)) ko(`${p}: <html lang> is not "${lang}"`);
  if (langues.length > 1) {
    const alternatives = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    for (const l of [...langues, "x-default"]) {
      if (!alternatives[l]) { ko(`${p}: no hreflang link for "${l}"`); continue; }
      let chemin = alternatives[l]; try { chemin = new URL(chemin).pathname; } catch { /* adresse relative */ }
      const cible = fichierDe(chemin);
      if (!cible) ko(`${p}: hreflang "${l}" points to a missing page (${chemin})`);
      else if (l !== "x-default" && langueDe(cible) !== l) ko(`${p}: hreflang "${l}" points to a page in another language (${chemin})`);
    }
    for (const l of autres.concat(ref).filter((x) => x !== lang)) if (!new RegExp(`<a href="[^"]*"[^>]*\\slang="${l}"[^>]*\\shreflang="${l}"`).test(html)) ko(`${p}: no link to the same page in "${l}" (language menu)`);
    if (!/<meta property="og:locale" content="[a-z]{2}_[A-Z]{2}"/.test(html)) ko(`${p}: og:locale is not a language_COUNTRY code`);
  }
  // 6. page française : pas de texte anglais, et la typographie française
  if (lang === "fr") {
    let lu = texteLu(html, lang);
    for (const permis of ANGLAIS_PERMIS) lu = lu.replaceAll(permis, " ");
    if (/[\\/]docs[\\/]/.test(p)) lu = lu.replace(CITATIONS, " ");
    const mots = [...new Set((lu.match(MOTS_ANGLAIS) || []).map((m) => m.toLowerCase()))];
    if (mots.length) { const m = new RegExp(`.{0,40}(?<![\\p{L}\\p{N}_])(?:${mots.join("|")})(?![\\p{L}\\p{N}_]).{0,40}`, "iu").exec(lu); ko(`${p}: English text left in a French page (${mots.slice(0, 8).join(", ")}): “…${m ? m[0].trim() : ""}…”`); }
    const typo = / [;!?»](?=\s|$)| :(?=\s|$)|« /.exec(lu);
    if (typo) attention(`${p}: French typography, ordinary space next to "${typo[0].trim()}": “…${lu.slice(Math.max(0, typo.index - 30), typo.index + 12).trim()}…”`);
  }
}

// 5. mêmes pages dans chaque langue
const relatif = (p, lang) => p.split(/[\\/]/).slice(lang === ref ? 1 : 2).join("/");
const pagesDe = Object.fromEntries(langues.map((l) => [l, new Set(pages.filter((p) => langueDe(p) === l && !/[\\/]404\.html$/.test(p)).map((p) => relatif(p, l)))]));
for (const l of autres) {
  for (const p of pagesDe[ref]) if (!pagesDe[l].has(p)) ko(`${l}: page missing in this language (${p})`);
  for (const p of pagesDe[l]) if (!pagesDe[ref].has(p)) ko(`${l}: page that does not exist in "${ref}" (${p})`);
}

// plan du site et flux RSS : un flux par langue
const flux = ["rss.xml", ...autres.map((l) => `${l}/rss.xml`)];
for (const f of [...flux, "sitemap.xml"]) {
  if (!existsSync(join("dist", f))) { ko(`dist/${f} is missing`); continue; }
  const t = readFileSync(join("dist", f), "utf8");
  for (const r of interdits) if (r.test(t)) ko(`dist/${f}: forbidden wording ${r}`);
  if (/\.example|localhost|127\.0\.0\.1/.test(t)) attention(`dist/${f}: an address is not the public one`);
  if (f.endsWith("rss.xml")) { const l = f.includes("/") ? f.split("/")[0] : ref; if (!t.includes(`<language>${l}</language>`)) ko(`dist/${f}: the feed does not declare the language "${l}"`); }
}
if (existsSync("dist/sitemap.xml")) {
  const plan = readFileSync("dist/sitemap.xml", "utf8"), adresses = [...plan.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const attendues = langues.reduce((n, l) => n + pagesDe[l].size, 0);
  if (adresses.length !== attendues) ko(`dist/sitemap.xml: ${adresses.length} addresses for ${attendues} pages`);
  for (const a of adresses) if (!fichierDe(a)) ko(`dist/sitemap.xml: address without a page (${a})`);
}

// 4. langues : mêmes fichiers et mêmes clés que la langue par défaut
const cles = (o, p = "") => (o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => cles(v, Array.isArray(o) ? p + "[]" : p + "." + k)) : [p]);
const empreinte = (sections) => createHash("sha1").update(JSON.stringify(sections)).digest("hex").slice(0, 12); // la même que celle de la synchronisation
for (const lang of autres) {
  for (const f of readdirSync(join(dossier, ref))) {
    const source = join(dossier, ref, f), cible = join(dossier, lang, f);
    if (statSync(source).isDirectory()) { // pages en Markdown : les mêmes fichiers dans chaque langue
      const ici = existsSync(cible) ? readdirSync(cible) : [];
      for (const md of readdirSync(source)) if (!ici.includes(md)) ko(`${lang}/${f}/${md} is missing`);
      for (const md of ici) if (!existsSync(join(source, md))) ko(`${lang}/${f}/${md} has no page in "${ref}"`);
      continue;
    }
    if (!existsSync(cible)) { (f === "_site.json" || f === "_changelog.json" ? ko : attention)(`${lang}/${f} is missing${f === "_library.json" || f === "_tour.json" ? `: the page shows the "${ref}" text` : ""}`); continue; }
    if (f === "_changelog.json") { // 7. notes de version : le fichier de la langue est une traduction, une entrée par version
      const traduites = JSON.parse(readFileSync(cible, "utf8")).entries || [];
      for (const v of JSON.parse(readFileSync(source, "utf8")).entries) {
        const t = traduites.find((x) => x.version === v.version);
        // une version qui vient de paraître (npm run versions, à la mise en ligne) n'est pas encore traduite : la page
        // l'affiche dans la langue par défaut avec une note ; la mise en ligne ne s'arrête pas pour autant
        if (!t) attention(`${lang}/${f}: version ${v.version} is not translated yet (the page shows it in "${ref}", with a note; source hash ${empreinte(v.sections)})`);
        else if (t.sourceHash !== empreinte(v.sections)) attention(`${lang}/${f}: the "${ref}" text of version ${v.version} changed since its translation (new source hash ${empreinte(v.sections)}): read the translation again`);
      }
      continue;
    }
    const a = new Set(cles(JSON.parse(readFileSync(source)))), b = new Set(cles(JSON.parse(readFileSync(cible))));
    for (const k of a) if (!b.has(k)) ko(`${lang}/${f}: missing text ${k}`);
  }
}
const parLangue = langues.map((l) => `${l} ${pagesDe[l].size}`).join(", ");
console.log(`${pages.length} pages checked (${parLangue}, and the "not found" page): ${erreurs} error(s), ${avertissements} warning(s).`);
process.exit(erreurs ? 1 : 0);
