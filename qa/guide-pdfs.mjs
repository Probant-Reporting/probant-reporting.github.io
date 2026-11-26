// Les deux manuels en PDF, mis en page pour l'impression : le manuel d'utilisation (les cinq guides par rôle de l'outil,
// avec leurs captures d'écran) et le manuel de l'équipe informatique (le guide d'installation, l'hébergement géré et
// les quatre documents pour l'IT : ce qu'il faut préparer, dossier de sécurité, du PC au serveur, compte d'entreprise ;
// avec leurs captures). Deux documents par langue, à joindre à un courriel ou à imprimer.
// Demandé par Florent le 25/11/2026 : « un beau PDF avec captures d'écran, qui puisse servir de manuel d'utilisation »
// (la première version imprimait les pages du site : police trop grosse, aucune capture).
//
// Une seule commande, à lancer dans le dossier du site :
//   node qa/guide-pdfs.mjs --tool <dépôt de l'outil>      (ou TOOL_REPO=<dépôt de l'outil> npm run pdf)
// Options : --tool <dépôt de l'outil> (ou TOOL_REPO) · --shots <dossier des captures> (par défaut docs/screenshots de
// l'outil) · --lang en,fr · --keep (garde le HTML intermédiaire, pour le regarder dans un navigateur)
//
// Les textes viennent de l'outil, comme le dit scripts/sync-tool.mjs pour la documentation : docs/guides/ (anglais),
// docs/fr/guides/ (français), docs/installation.md, docs/managed_hosting.md et les quatre documents pour l'IT (et leurs
// versions françaises ; liste dans src/lib/docs-outil.mjs). On ne
// reprend pas ce que le site ne présente pas : l'assistant IA facultatif et la relecture des traductions (mêmes règles
// que sync-tool.mjs), ni les renvois vers les autres langues, ni les liens vers des fichiers du dépôt (texte seul).
// Le qui et le quoi de chaque rôle viennent des guides du site (src/content/<langue>/guides/*.md : who, summary).
//
// Ce qu'elle écrit :
//   public/pdf/probant-guides-<langue>.pdf             le manuel d'utilisation
//   public/pdf/probant-it-documentation-<langue>.pdf   le manuel de l'équipe informatique
// Les liens vers ces fichiers sont posés par src/components/GuidesIndex.astro, DocPage.astro et ProsePage.astro.
// Aucun numéro de version et aucune date : un guide publié n'en porte pas.
//
// Mise en page : A4, Source Sans 3 en 9,5 pt pour le texte et Source Serif 4 pour les titres (les polices du site),
// couverture, sommaire avec les numéros de page, « L'essentiel » (fonctions clés avec renvois aux pages, rôles en bref ;
// pour l'IT : ce qu'elle fait et les opérations), chapitres à la suite, étapes numérotées, captures encadrées et
// légendées, encadrés pour « Important », signets du PDF. Demandé ensuite : « gagner énormément de place » et « des exec
// sum pour les fonctions clés » (Florent, 25/11/2026). Les numéros du sommaire sont lus dans une
// première impression (destinations nommées du PDF, pypdf), puis le document est imprimé une seconde fois avec eux.
import { createRequire } from "node:module";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import config from "../site.config.mjs";
import { DOCS_OUTIL, GUIDES_COUPES, RESTES_IA, couperTextes } from "../src/lib/docs-outil.mjs";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync, mkdtempSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
const { chromium } = createRequire(import.meta.url)("playwright");

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const option = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const OUTIL = resolve(option("tool", process.env.TOOL_REPO || ""));
const CAPTURES = resolve(option("shots", join(OUTIL, "docs", "screenshots")));
const LANGUES = option("lang", "en,fr").split(",").map((x) => x.trim()).filter(Boolean);
const GARDER = process.argv.includes("--keep");
// --only manuels ou --only fiche : une seule sorte de document (pour mettre au point) ; par défaut, les deux
const SEULEMENT = option("only", "");
const SORTIE = join(SITE, "public", "pdf");
if (!option("tool", process.env.TOOL_REPO) || !existsSync(join(OUTIL, "docs", "guides"))) { console.error(`${OUTIL} : dépôt de l'outil introuvable (--tool ou TOOL_REPO).`); process.exit(2); }
mkdirSync(SORTIE, { recursive: true });
const TRAVAIL = mkdtempSync(join(tmpdir(), "probant-pdf-"));
const PYTHON = process.env.PYTHON || "python3";

// ── Textes propres aux manuels (le reste vient de l'outil et du site) ──────────────────────────────────────────
const TEXTES = {
  en: {
    guides: { fichier: "probant-guides", titre: "User manual", sous: "How to use {name}, role by role, with the screens of the tool." },
    it: { fichier: "probant-it-documentation", titre: "IT manual", sous: "Install, run, back up, and update {name}: the guide for the IT team." },
    sommaire: "Contents", roles: "Roles at a glance", role: "Role", qui: "Who", quoi: "What you do", figure: "Figure",
    lireRoles: "Each chapter is the guide of one role. Read the chapter of your role: it gives each task in a few steps, with the screen that you will see.",
    demo: "The screens come from the fictitious demo of the tool. No real data is shown.",
    chapitre: "Chapter", apercu: "At a glance", essentiel: "Key functions", voir: "See:", page: "p.",
    essentielLead: "What {name} does, in one page. Each function sends you to the tasks that use it.",
    fiche: { fichier: "probant-it-sheet", titre: "IT sheet", docs: "IT documentation" },
  },
  fr: {
    guides: { fichier: "probant-guides", titre: "Manuel d'utilisation", sous: "Utiliser {name}, rôle par rôle, avec les écrans de l'outil." },
    it: { fichier: "probant-it-documentation", titre: "Manuel de l'équipe informatique", sous: "Installer, exploiter, sauvegarder et mettre à jour {name} : le guide de l'équipe informatique." },
    sommaire: "Sommaire", roles: "Les rôles en bref", role: "Rôle", qui: "Pour qui", quoi: "Ce que vous faites", figure: "Figure",
    lireRoles: "Chaque chapitre est le guide d'un rôle. Lisez le chapitre de votre rôle : il donne chaque tâche en quelques étapes, avec l'écran que vous verrez.",
    demo: "Les écrans viennent de la démo fictive de l'outil. Aucune donnée réelle n'y figure.",
    chapitre: "Chapitre", apercu: "L'essentiel", essentiel: "L'essentiel", voir: "Voir\u00a0:", page: "p.",
    essentielLead: "Ce que fait {name}, en une page. Chaque fonction renvoie aux tâches qui s'en servent.",
    fiche: { fichier: "probant-it-sheet", titre: "Fiche pour l'IT", docs: "Documentation IT" },
  },
};
// guides de l'outil, dans l'ordre du site (champ order des guides du site) ; même nom de fichier côté site
const GUIDES_OUTIL = {
  en: { dossier: "docs/guides", fichiers: { administrator: "administrator", validator: "validator", contributor: "contributor", reader: "reader", auditor: "auditor" } },
  fr: { dossier: "docs/fr/guides", fichiers: { administrator: "administrateur", validator: "validateur", contributor: "contributeur", reader: "lecteur", auditor: "auditeur" } },
};
// documentation de l'équipe informatique (guide d'installation, hébergement géré, les quatre documents pour l'IT), et ce
// que le site n'en reprend pas : les mêmes règles que la page /docs/ (src/lib/docs-outil.mjs)

// ── Markdown → HTML ─────────────────────────────────────────────────────────────────────────────────────────
const md = await createMarkdownProcessor({ syntaxHighlight: false, smartypants: false });
const echappe = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nomProduit = (t) => t.replace(/\{name\}/g, config.name);

function ecarter(texte, regles) {
  const sortie = []; let saute = false, niveau = 0;
  for (const l of texte.split("\n")) {
    const h = l.match(/^(#{2,4}) /);
    if (h) {
      if (saute && h[1].length <= niveau) saute = false;
      if (!saute && regles.ecartees.some((r) => r.test(l.trim()))) { saute = true; niveau = h[1].length; }
    }
    if (!saute && !regles.lignes.some((r) => r.test(l))) sortie.push(l);
  }
  // puis les morceaux de phrase et les lignes qui citent ce que le site ne présente pas (src/lib/docs-outil.mjs)
  return couperTextes(sortie.join("\n"), regles);
}
// Garde-fou : aucun texte imprimé ne cite l'assistant IA facultatif (règles de src/lib/docs-outil.mjs).
function sansIA(texte, ou) {
  const ligne = texte.split("\n").find((l) => RESTES_IA.test(l));
  if (ligne) { console.error(`${ou} : l'assistant IA facultatif est encore cité (« ${ligne.trim().slice(0, 140)} »). Ajoutez une coupe dans src/lib/docs-outil.mjs.`); process.exit(1); }
  return texte;
}
function nettoyer(texte) {
  return texte
    .replace(/ \(`(?:docs\/history|qa)\/[^`]+`\)/g, "") // renvois vers des fichiers de travail, non publiés
    .replace(/^.*(?:French version|English version|Version anglaise|Version française)\s?: \[[^\]]+\]\([^)]+\)\.?\s*$/gm, (l) =>
      l.replace(/\s*(?:French version|English version|Version anglaise|Version française)\s?: \[[^\]]+\]\([^)]+\)\.?/, "")) // renvoi vers l'autre langue
    .replace(/(?<!!)\[([^\]]+)\]\((?!https?:)[^)]+\)/g, "$1") // liens vers des fichiers du dépôt ou des ancres : texte seul
    .replace(/\n{3,}/g, "\n\n");
}

// Les captures sont des PNG de 2 560 px de large : on les passe en JPEG de 1 500 px au plus (300 dpi à la largeur
// d'une figure), deux fois plus léger que le PNG embarqué tel quel. Une seule conversion par fichier.
const allegees = new Map();
function allegee(fichier) {
  if (!allegees.has(fichier)) {
    const sortie = join(TRAVAIL, `${allegees.size}-${basename(fichier, ".png")}.jpg`);
    execFileSync(PYTHON, ["-c", `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
if im.width > 1500: im = im.resize((1500, round(im.height * 1500 / im.width)), Image.LANCZOS)
im.save(sys.argv[2], "JPEG", quality=82, optimize=True, progressive=True)
`, fichier, sortie]);
    allegees.set(fichier, pathToFileURL(sortie).href);
  }
  return allegees.get(fichier);
}
const capture = (lang, nom) => [join(CAPTURES, lang, nom), join(OUTIL, "docs", "screenshots", lang, nom)].find((f) => existsSync(f));

let numeroFigure = 0;
async function rendre(texte, lang, T) {
  // une image seule sur sa ligne = une capture : figure numérotée, légendée par son texte de remplacement
  const blocs = [];
  const avecFigures = texte.replace(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/gm, (t, alt, src) => {
    const nom = basename(src);
    const fichier = capture(lang, nom);
    if (!fichier) { console.error(`Capture absente : ${lang}/${nom}`); process.exit(1); }
    numeroFigure += 1;
    const telephone = /phone/.test(nom);
    blocs.push(`<figure class="capture${telephone ? " telephone" : ""}"><img src="${allegee(fichier)}" alt="${echappe(alt)}">` +
      `<figcaption><span>${T.figure} ${numeroFigure}</span> ${echappe(alt)}</figcaption></figure>`);
    return `\n\nFIGURE${blocs.length - 1}FIN\n\n`;
  });
  let html = (await md.render(avecFigures)).code;
  html = html.replace(/<p>FIGURE(\d+)FIN<\/p>/g, (t, i) => blocs[Number(i)]);
  // encadrés : un paragraphe cité qui commence par un mot en gras (Important, Warning, Note…)
  html = html.replace(/<blockquote>/g, '<aside class="encadre">').replace(/<\/blockquote>/g, "</aside>");
  return html;
}

// Un guide de l'outil : son titre, son introduction, ses sections « ## Titre {#ancre} ».
function decouper(texte) {
  const [tete, ...sections] = texte.split(/\n(?=## )/);
  const titre = (tete.match(/^# (.+)$/m) || [, ""])[1].trim();
  const intro = tete.replace(/^# .+$/m, "").trim();
  return { titre, intro, sections: sections.map((s) => {
    const [ligne, ...reste] = s.split("\n");
    const m = ligne.replace(/^## /, "").match(/^(.*?)\s*(?:\{#([\w-]+)\})?\s*$/);
    return { titre: m[1].trim(), ancre: m[2] || "", corps: reste.join("\n").trim() };
  }) };
}
const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function frontmatter(texte) {
  const fm = {}; const m = texte.match(/^---\n([\s\S]*?)\n---/);
  if (m) for (const l of m[1].split("\n")) { const x = l.match(/^(\w+):\s*(.*)$/); if (x) { try { fm[x[1]] = JSON.parse(x[2]); } catch { fm[x[1]] = x[2]; } } }
  return fm;
}

// Fonctions clés de « L'essentiel » : la capture qui la montre et les sections des guides qui s'en servent (identifiants
// des sections : clé du rôle sur le site + ancre de la section dans l'outil, les mêmes dans toutes les langues).
const FONCTIONS = {
  campaigns: { ecran: "admin-campaigns", voir: ["administrator-campaign", "contributor-find", "validator-review"] },
  evidence: { ecran: "audit-entry", voir: ["contributor-evidence", "auditor-evidence", "administrator-audit-file"] },
  consolidation: { ecran: "consolidation", voir: ["reader-consolidation", "reader-visualisation"] },
  consistency: { ecran: "consistency", voir: ["contributor-check", "validator-alerts"] },
  library: { ecran: "setup-frameworks", voir: ["administrator-setup", "administrator-framework"] },
  field: { ecran: "entry-phone", voir: ["contributor-enter", "contributor-phone"] },
};

// ── Les deux documents ───────────────────────────────────────────────────────────────────────────────────────
async function manuelUtilisation(lang) {
  const T = TEXTES[lang], G = GUIDES_OUTIL[lang];
  const roles = readdirSync(join(SITE, "src/content", lang, "guides")).filter((f) => f.endsWith(".md"))
    .map((f) => ({ cle: f.replace(/\.md$/, ""), fm: frontmatter(readFileSync(join(SITE, "src/content", lang, "guides", f), "utf8")) }))
    .sort((a, b) => (a.fm.order ?? 99) - (b.fm.order ?? 99));
  const chapitres = [];
  for (const r of roles) {
    const fichier = join(OUTIL, G.dossier, `${G.fichiers[r.cle]}.md`);
    const guide = decouper(sansIA(nettoyer(ecarter(readFileSync(fichier, "utf8"), GUIDES_COUPES[lang])), fichier));
    const sections = [];
    for (const s of guide.sections) sections.push({ id: `${r.cle}-${s.ancre || slug(s.titre)}`, titre: s.titre, html: await rendre(s.corps, lang, T) });
    chapitres.push({ id: r.cle, titre: guide.titre, qui: nomProduit(r.fm.who || ""), resume: nomProduit(r.fm.summary || ""),
      desc: [r.fm.who, r.fm.summary].filter(Boolean).map(nomProduit).join(" · "), intro: await rendre(guide.intro, lang, T), sections });
  }
  // L'essentiel : les fonctions clés, avec les textes de la page d'accueil du site (esg.json, features), une capture et
  // les tâches du manuel qui s'en servent. Les rôles (qui, quoi) sont dans le sommaire.
  const titres = Object.fromEntries(chapitres.flatMap((c) => c.sections.map((s) => [s.id, s.titre])));
  const accueil = JSON.parse(readFileSync(join(SITE, "src/content", lang, "esg.json"), "utf8"));
  const fonctions = accueil.features.filter((f) => FONCTIONS[f.id]).map((f) => {
    const F = FONCTIONS[f.id];
    for (const id of F.voir) if (!titres[id]) { console.error(`L'essentiel (${lang}) : section ${id} introuvable dans les guides`); process.exit(1); }
    const fichier = capture(lang, `${F.ecran}.png`);
    if (!fichier) { console.error(`Capture absente : ${lang}/${F.ecran}.png`); process.exit(1); }
    return { ...f, image: allegee(fichier), telephone: /phone/.test(F.ecran), voir: F.voir.map((id) => ({ id, titre: titres[id] })) };
  });
  const avant = (lien) => `<section class="avant essentiel"><h2 class="titre-avant" id="essentiel">${T.essentiel}</h2><p class="chapeau">${echappe(nomProduit(T.essentielLead))}</p>` +
    fonctions.map((f) => `<div class="fonction${f.telephone ? " telephone" : ""}"><img src="${f.image}" alt=""><div><h3>${echappe(nomProduit(f.title))}</h3>` +
      `<p>${echappe(nomProduit(f.lead))}</p>${f.points.length ? `<ul>${f.points.map((x) => `<li>${echappe(nomProduit(x))}</li>`).join("")}</ul>` : ""}` +
      `<p class="voir"><b>${T.voir}</b> ${f.voir.map((v) => lien(v.id, v.titre, true)).join(" · ")}</p></div></div>`).join("") +
    `<p class="note-demo">${T.demo}</p></section>`;
  return { T, doc: T.guides, chapitres, avant, chapeauSommaire: T.lireRoles,
    premiers: [{ id: "essentiel", titre: T.essentiel, desc: nomProduit(T.essentielLead) }] };
}

async function manuelIT(lang) {
  const T = TEXTES[lang], D = DOCS_OUTIL[lang];
  const install = sansIA(nettoyer(ecarter(readFileSync(join(OUTIL, D.installation), "utf8"), D)), D.installation);
  const gere = sansIA(nettoyer(ecarter(readFileSync(join(OUTIL, D.gere), "utf8"), D)), D.gere);
  const [tete, ...sections] = install.split(/\n(?=## )/);
  const intro = tete.replace(/^# .+$/m, "").trim();
  const chapitres = [];
  // une phrase par chapitre, pour le sommaire : celle de la carte de la page du site (src/content/<langue>/_doc_descriptions.json)
  const descriptions = JSON.parse(readFileSync(join(SITE, "src/content", lang, "_doc_descriptions.json"), "utf8")).descriptions;
  // clé de chaque chapitre : l'adresse de la page du site (titre anglais de la section de même rang, comme sync-tool.mjs)
  const sectionsEn = ecarter(readFileSync(join(OUTIL, DOCS_OUTIL.en.installation), "utf8"), DOCS_OUTIL.en).split(/\n(?=## )/).slice(1);
  const cles = sectionsEn.map((x) => x.split("\n")[0].replace(/^## /, "").toLowerCase().replace(/^\d+\.\s*/, "").replace(/`/g, "").replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  if (cles.length !== sections.length) { console.error(`Manuel IT (${lang}) : ${sections.length} chapitres, ${cles.length} en anglais`); process.exit(1); }
  const chapitre = async (titre, texte, id, cle) => {
    // les intertitres ### deviennent les sections du chapitre ; ce qui les précède est son introduction (vide quand le
    // chapitre commence par un intertitre, comme « Monitor the tool » : sans le « \n » ajouté, sa première section
    // restait dans l'introduction, hors du plan du chapitre)
    const [debut, ...sous] = ("\n" + texte).split(/\n(?=### )/);
    const secs = [];
    for (const s of sous) {
      const [ligne, ...reste] = s.split("\n"); const t = ligne.replace(/^### /, "").replace(/`/g, "").trim();
      secs.push({ id: `${id}-${slug(t)}`, titre: t, html: await rendre(reste.join("\n").replace(/^#### /gm, "### "), lang, T) });
    }
    chapitres.push({ id, titre, cle, desc: nomProduit(descriptions[cle] || ""), intro: await rendre(debut, lang, T), sections: secs });
  };
  // Les chapitres dans l'ordre du menu de la page /docs/ du site (« ordre » de src/lib/docs-outil.mjs) : les sections du
  // guide d'installation (1 à 11), l'hébergement géré (2,5) et les quatre documents pour l'IT (ce qu'il faut préparer
  // et le dossier de sécurité d'abord, le passage du PC au serveur après la mise en place, la connexion d'entreprise
  // après les réglages). Dans un document, les intertitres ## deviennent les sections du chapitre, les ### leurs
  // intertitres.
  const aFaire = [];
  for (const [i, s] of sections.entries()) {
    const [ligne, ...reste] = s.split("\n");
    const titre = ligne.replace(/^## /, "").replace(/^\d+\.\s*/, "").replace(/`/g, "").trim();
    aFaire.push({ ordre: i + 1, faire: () => chapitre(titre, reste.join("\n").trim(), slug(titre), cles[i]) });
  }
  const g = gere.split("\n"); const titreGere = D.titreGere; // le titre court du site, pas le titre long du guide
  aFaire.push({ ordre: 2.5, faire: () => chapitre(titreGere, g.slice(1).join("\n").replace(/^## /gm, "### ").replace(/^### (?=#)/gm, "").trim(), "managed-hosting", "managed-hosting") });
  for (const [cle, a] of Object.entries(D.autres)) {
    let texte = sansIA(nettoyer(ecarter(readFileSync(join(OUTIL, a.fichier), "utf8"), D)), a.fichier).replace(/^# .+\n/, "");
    if (a.note) texte = texte.replace(/\n## /, `\n${a.note}\n\n## `); // la note écrite pour le site (dossier de sécurité)
    aFaire.push({ ordre: a.ordre, faire: () => chapitre(a.titre, texte.replace(/^### /gm, "#### ").replace(/^## /gm, "### ").trim(), cle, cle) });
  }
  for (const c of aFaire.sort((x, y) => x.ordre - y.ordre)) await c.faire();
  // L'essentiel : ce que fait l'IT (page d'accueil du site : features « it » et specs), puis l'introduction du guide
  // d'installation (les opérations, leurs commandes et leur durée).
  const accueil = JSON.parse(readFileSync(join(SITE, "src/content", lang, "esg.json"), "utf8"));
  const it = accueil.features.find((f) => f.id === "it");
  const introHtml = await rendre(intro, lang, T);
  const avant = () => `<section class="avant intro-it"><h2 class="titre-avant" id="apercu">${T.apercu}</h2>` +
    (it ? `<p class="chapeau">${echappe(nomProduit(it.lead))}</p>` : "") +
    `<table class="specs"><tbody>${accueil.specs.map((x) => `<tr><th>${echappe(nomProduit(x.term))}</th><td>${echappe(nomProduit(x.value))}</td></tr>`).join("")}</tbody></table>` +
    `<div class="contenu">${introHtml}</div></section>`;
  return { T, doc: T.it, chapitres, avant, premiers: [{ id: "apercu", titre: T.apercu, desc: it ? nomProduit(it.lead) : "" }] };
}

// ── Page HTML ────────────────────────────────────────────────────────────────────────────────────────────────
const police = (f) => pathToFileURL(join(SITE, "public", "fonts", f)).href;
const CSS = `
@font-face { font-family: "Source Sans 3"; font-weight: 400; src: url("${police("source-sans-3-latin-400-normal.woff2")}"); }
@font-face { font-family: "Source Sans 3"; font-weight: 400; src: url("${police("source-sans-3-latin-ext-400-normal.woff2")}"); unicode-range: U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF; }
@font-face { font-family: "Source Sans 3"; font-weight: 600; src: url("${police("source-sans-3-latin-600-normal.woff2")}"); }
@font-face { font-family: "Source Sans 3"; font-weight: 700; src: url("${police("source-sans-3-latin-700-normal.woff2")}"); }
@font-face { font-family: "Source Serif 4"; font-weight: 600; src: url("${police("source-serif-4-latin-600-normal.woff2")}"); }
@font-face { font-family: "Source Serif 4"; font-weight: 600; src: url("${police("source-serif-4-latin-ext-600-normal.woff2")}"); unicode-range: U+0100-024F, U+1E00-1EFF; }
:root { --encre: #171A1F; --doux: #555A62; --filet: #DAD7CE; --filet-fort: #8A8880; --marque: #334155; --teinte: #E9EAEC; --papier: #F8F7F3; --papier-2: #EFEDE6; }
@page { size: A4; margin: 14mm 15mm 16mm; }
* { box-sizing: border-box; }
html { font-family: "Source Sans 3", Arial, sans-serif; font-size: 9.5pt; line-height: 1.42; color: var(--encre); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; }
h1, h2, h3, h4 { font-family: "Source Serif 4", Georgia, serif; font-weight: 600; letter-spacing: -0.01em; line-height: 1.2; break-after: avoid; }
p, li { orphans: 3; widows: 3; }
p { margin: 0 0 2mm; }
a { color: inherit; text-decoration: none; }
strong { font-weight: 600; color: var(--marque); }
code { font-family: "DejaVu Sans Mono", Consolas, monospace; font-size: 8.4pt; background: var(--papier-2); border-radius: 2px; padding: 0 1.2mm; overflow-wrap: anywhere; }
pre { font-family: "DejaVu Sans Mono", Consolas, monospace; font-size: 7.6pt; line-height: 1.4; background: var(--papier); border: 0.3mm solid var(--filet); border-left: 1mm solid var(--marque); border-radius: 1mm; padding: 2mm 3mm; margin: 0 0 2.6mm; white-space: pre-wrap; overflow-wrap: anywhere; break-inside: avoid; }
pre code { background: none; padding: 0; font-size: inherit; }
ul, ol { margin: 0 0 2.4mm; padding-left: 6mm; }
li { margin: 0 0 0.8mm; }
li > p { margin: 0; }
/* étapes numérotées : pastilles */
.contenu ol { list-style: none; counter-reset: etape; padding-left: 7.5mm; }
.contenu ol > li { counter-increment: etape; position: relative; }
.contenu ol > li::before { content: counter(etape); position: absolute; left: -7.5mm; top: 0.3mm; width: 4.6mm; height: 4.6mm; border-radius: 50%; background: var(--marque); color: #fff; font: 700 7pt/4.6mm "Source Sans 3", sans-serif; text-align: center; }
table { width: 100%; border-collapse: collapse; margin: 0 0 3mm; font-size: 8.4pt; line-height: 1.35; break-inside: auto; }
th, td { text-align: left; vertical-align: top; padding: 1.1mm 2mm; border-bottom: 0.3mm solid var(--filet); }
thead th { background: var(--teinte); font-weight: 600; border-bottom: 0.4mm solid var(--filet-fort); }
tr { break-inside: avoid; }
td:first-child code { overflow-wrap: normal; word-break: normal; white-space: nowrap; font-size: 7.8pt; }
.encadre { margin: 0 0 2.6mm; padding: 2mm 3mm; background: var(--papier); border-left: 1mm solid #A86F00; border-radius: 1mm; break-inside: avoid; }
.encadre p:last-child { margin-bottom: 0; }
.encadre strong:first-child { color: #7A4F00; }
/* captures */
figure.capture { margin: 2mm auto 3.6mm; width: 124mm; break-inside: avoid; }
figure.capture img { display: block; width: 100%; border: 0.3mm solid var(--filet-fort); border-radius: 1.4mm; box-shadow: 0 1.2mm 3mm rgba(20, 24, 32, .12); }
figure.capture.telephone { float: right; width: 40mm; margin: 0 0 3mm 6mm; }
figure.capture.telephone img { border-radius: 2.4mm; }
.section::after { content: ""; display: block; clear: both; }
figure.capture figcaption { margin-top: 1.4mm; font-size: 8pt; line-height: 1.35; color: var(--doux); }
figure.capture.telephone figcaption { text-align: left; }
figcaption span { font-weight: 700; color: var(--encre); margin-right: 1mm; }
/* couverture */
.couverture { height: 265mm; display: flex; flex-direction: column; break-after: page; }
.couverture .marque { display: flex; align-items: center; gap: 2.6mm; font: 600 17pt/1 "Source Serif 4", serif; letter-spacing: -0.01em; color: var(--encre); }
.couverture .marque svg { width: 1.2em; height: 1.2em; flex: none; }
.couverture h1 { margin: 78mm 0 5mm; padding-top: 6mm; border-top: 1.2mm solid var(--marque); max-width: 150mm; font-size: 38pt; line-height: 1.02; letter-spacing: -0.02em; }
.couverture .sous { font-size: 14pt; line-height: 1.35; color: var(--doux); max-width: 135mm; }
.couverture .adresse { margin-top: auto; padding-top: 3mm; border-top: 0.3mm solid var(--filet); display: flex; justify-content: space-between; font-size: 9.5pt; color: var(--doux); }
/* sommaire : une ligne par chapitre */
.sommaire { break-after: page; }
.sommaire h2, .titre-avant { font-size: 20pt; margin: 0 0 3mm; }
.titre-avant.petit { font-size: 14pt; margin: 6mm 0 2.4mm; }
.chapeau { font-size: 10.5pt; color: var(--doux); margin-bottom: 5mm; max-width: 160mm; }
.sommaire ol { list-style: none; padding: 0; margin: 0; border-top: 0.6mm solid var(--marque); }
.sommaire li { margin: 0; border-bottom: 0.3mm solid var(--filet); break-inside: avoid; }
.sommaire a { display: grid; grid-template-columns: 14mm 1fr 14mm; align-items: baseline; padding: 3.4mm 0; }
.sommaire .n { font: 600 20pt/1 "Source Serif 4", serif; color: var(--marque); }
.sommaire .tx b { display: block; font: 600 13pt/1.25 "Source Serif 4", serif; }
.sommaire .tx small { display: block; margin-top: 1mm; font-size: 9pt; line-height: 1.35; color: var(--doux); }
.sommaire .p { text-align: right; font: 600 13pt/1 "Source Serif 4", serif; font-variant-numeric: tabular-nums; }
.sommaire.serre a { padding: 2.2mm 0; grid-template-columns: 11mm 1fr 12mm; }
.sommaire.serre .n { font-size: 15pt; }
.sommaire.serre .tx b, .sommaire.serre .p { font-size: 11.5pt; }
.sommaire.serre .tx small { font-size: 8.4pt; margin-top: 0.6mm; }
/* plus de 13 chapitres (manuel de l'IT avec les quatre documents de la 1.1.0) : le sommaire tient encore sur une page */
.sommaire.tres-serre h2 { margin-bottom: 2mm; }
.sommaire.tres-serre a { padding: 1.2mm 0; grid-template-columns: 10mm 1fr 11mm; }
.sommaire.tres-serre .n { font-size: 13pt; }
.sommaire.tres-serre .tx b, .sommaire.tres-serre .p { font-size: 10.5pt; }
.sommaire.tres-serre .tx small { font-size: 7.8pt; line-height: 1.3; margin-top: 0.3mm; }
.avant.intro-it { break-after: page; }
.avant table.roles td:first-child { white-space: nowrap; font-weight: 600; }
.fonction { display: flex; gap: 5mm; align-items: flex-start; padding: 3mm 0; border-top: 0.3mm solid var(--filet); break-inside: avoid; }
.fonction > img { flex: none; width: 52mm; border: 0.3mm solid var(--filet-fort); border-radius: 1mm; }
.fonction.telephone > img { width: 20mm; margin: 0 16mm; border-radius: 1.6mm; }
.fonction h3 { font-size: 11.5pt; margin: 0 0 1mm; }
.fonction p { margin: 0 0 1mm; }
.fonction ul { margin: 0 0 1mm; font-size: 8.6pt; color: var(--doux); }
.fonction li { margin: 0; }
.voir { font-size: 8.4pt; }
.voir a { color: var(--marque); }
table.specs { margin-bottom: 4mm; }
table.specs th { width: 42mm; font-weight: 600; }
.note-demo { font-size: 8.8pt; color: var(--doux); }
.intro-it h1 { display: none; }
/* chapitres */
.chapitre { margin-top: 9mm; }
.avant + .chapitre { margin-top: 0; }
.ouverture { display: flex; gap: 5mm; align-items: flex-start; padding: 4mm 5mm; margin-bottom: 0; background: var(--marque); color: #fff; border-radius: 1.6mm 1.6mm 0 0; break-after: avoid; break-inside: avoid; } /* un bandeau de chapitre n'est jamais coupé entre deux pages */
.ouverture .grand { font: 600 40pt/0.9 "Source Serif 4", serif; color: #A9AFB8; }
.ouverture .num { margin: 0; font: 700 8pt/1 "Source Sans 3", sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #C9CDD3; }
.ouverture h2 { font-size: 19pt; margin: 1.4mm 0 0; color: #fff; }
.ouverture .qui { margin: 1.2mm 0 0; font-size: 9.5pt; color: #E3E6EA; }
/* plan du chapitre : ses sections et leur page */
.plan { list-style: none; margin: 0 0 4mm; padding: 2.6mm 5mm 2.2mm; columns: 2; column-gap: 9mm; background: var(--papier); border: 0.3mm solid var(--filet); border-top: 0; border-radius: 0 0 1.6mm 1.6mm; break-before: avoid; break-inside: avoid; }
.plan li { margin: 0; break-inside: avoid; font-size: 8.4pt; line-height: 1.5; }
.plan a { display: flex; align-items: baseline; }
.plan a::after { content: ""; order: 1; flex: 1 1 3mm; border-bottom: 0.3mm dotted var(--filet-fort); margin: 0 1mm; transform: translateY(-0.7mm); }
.plan .p { order: 2; flex: none; font-variant-numeric: tabular-nums; color: var(--doux); }
.ouverture + .contenu { margin-top: 4mm; }
.section { margin-top: 4mm; padding-top: 3mm; border-top: 0.3mm solid var(--filet); }
.section h3 { font: 700 8.6pt/1.3 "Source Sans 3", sans-serif; letter-spacing: .06em; text-transform: uppercase; color: var(--marque); margin: 3.4mm 0 1.4mm; }
.section h4 { font: 700 9.5pt/1.3 "Source Sans 3", sans-serif; margin: 2.4mm 0 1.2mm; }
.section h3.ts { font: 600 12.5pt/1.2 "Source Serif 4", serif; letter-spacing: -0.01em; text-transform: none; color: var(--encre); margin: 0 0 1.8mm; }
`;

// Le logo du site (src/components/Logo.astro) : une case et une coche d'auditeur qui en sort.
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="8" width="21" height="21" rx="4" fill="none" stroke="#171A1F" stroke-width="2.5"/>` +
  `<path d="M9 18.5l5 5L29 5.5" fill="none" stroke="#334155" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function pageHtml(lang, d, numeros) {
  const { T, doc, chapitres, premiers } = d;
  const num = (id) => (numeros && numeros[id] ? numeros[id] : "");
  const lien = (id, t, court) => court ? `<a href="#${id}">${echappe(t)}${num(id) ? `, ${T.page}${"\u00a0"}${num(id)}` : ""}</a>`
    : `<a href="#${id}"><span class="t">${echappe(t)}</span><span class="p">${num(id)}</span></a>`;
  const avant = d.avant(lien);
  // sommaire : une ligne par chapitre (numéro, titre, une phrase, page) ; le détail des sections ouvre chaque chapitre
  const entree = (id, n, titre, desc) => `<li><a href="#${id}"><span class="n">${n}</span><span class="tx"><b>${echappe(titre)}</b>` +
    (desc ? `<small>${echappe(desc)}</small>` : "") + `</span><span class="p">${num(id)}</span></a></li>`;
  const sommaire = `<nav class="sommaire${chapitres.length > 8 ? " serre" : ""}${chapitres.length > 13 ? " tres-serre" : ""}"><h2>${T.sommaire}</h2>` +
    (d.chapeauSommaire ? `<p class="chapeau">${echappe(d.chapeauSommaire)}</p>` : "") + `<ol>` +
    premiers.map((x) => entree(x.id, "", x.titre, x.desc)).join("") +
    chapitres.map((c, i) => entree(c.id, i + 1, c.titre, c.desc)).join("") + `</ol></nav>`;
  const corps = chapitres.map((c, i) => `<article class="chapitre"><header class="ouverture"><span class="grand">${i + 1}</span><div>` +
    `<p class="num">${T.chapitre} ${i + 1}</p><h2 id="${c.id}">${echappe(c.titre)}</h2>` +
    (c.desc ? `<p class="qui">${echappe(c.desc)}</p>` : "") + `</div></header>` +
    (c.sections.length > 1 ? `<ol class="plan">${c.sections.map((s) => `<li>${lien(s.id, s.titre)}</li>`).join("")}</ol>` : "") +
    `<div class="contenu">${c.intro}</div>` +
    c.sections.map((s) => `<section class="section contenu"><h3 class="ts" id="${s.id}">${echappe(s.titre)}</h3>${s.html}</section>`).join("") + `</article>`).join("");
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${echappe(`${config.name} – ${doc.titre}`)}</title><style>${CSS}</style></head><body>` +
    `<section class="couverture"><p class="marque">${LOGO}${echappe(config.name)}</p><h1>${echappe(doc.titre)}</h1><p class="sous">${echappe(nomProduit(doc.sous))}</p>` +
    `<p class="adresse"><span>${echappe(config.url.replace(/^https?:\/\//, ""))}</span><span>${echappe(config.licence)}</span></p></section>` +
    sommaire + avant + corps + `</body></html>`;
}

// ── Impression ───────────────────────────────────────────────────────────────────────────────────────────────
// Le pied de page porte le titre et le numéro ; la couverture n'en a pas : elle est imprimée à part, puis les deux
// fichiers sont réunis (pypdf), signets et liens compris. La couverture ne compte pas : la page qui la suit est la
// page 1, dans le pied, dans le sommaire et dans les numéros de page du lecteur de PDF (/PageLabels).
const PY_NUMEROS = `
import sys, json
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
d = int(sys.argv[2])
print(json.dumps({k.lstrip("/"): r.get_destination_page_number(v) + 1 - d for k, v in r.named_destinations.items()}))
`;
const PY_REUNIR = `
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.constants import PageLabelStyle
couverture, corps, sortie, titre, auteur = sys.argv[1:6]
from pypdf.generic import ArrayObject, NameObject, NumberObject, NullObject, FloatObject
lu = PdfReader(corps)
cibles = {k.lstrip("/"): (lu.get_destination_page_number(v), v.top) for k, v in lu.named_destinations.items()}
w = PdfWriter(clone_from=corps)
w.insert_page(PdfReader(couverture).pages[0], 0)
# liens internes (sommaire, plans, renvois) : la page et la hauteur écrites en clair, au lieu d'une destination nommée
# que bien des lecteurs de PDF (navigateurs, téléphones) ne suivent pas
for page in w.pages:
    for ref in page.get("/Annots") or []:
        lien = ref.get_object()
        dest = lien.get("/Dest")
        if lien.get("/Subtype") != "/Link" or dest is None or isinstance(dest, ArrayObject):
            continue
        n, haut = cibles[str(dest).lstrip("/")]
        lien[NameObject("/Dest")] = ArrayObject([w.pages[n + 1].indirect_reference, NameObject("/XYZ"), NullObject(),
                                                FloatObject(haut) if haut is not None else NullObject(), NullObject()])
w.set_page_label(0, 0, prefix="")
w.set_page_label(1, len(w.pages) - 1, style=PageLabelStyle.DECIMAL, start=1)
w.add_metadata({"/Title": titre, "/Author": auteur, "/Creator": "", "/Producer": ""})
w.page_mode = "/UseOutlines"
with open(sortie, "wb") as f: w.write(f)
`;
const MARGES = { top: "14mm", bottom: "16mm", left: "15mm", right: "15mm" };

async function imprimer(nav, lang, d) {
  const page = await nav.newPage();
  const fichierHtml = join(TRAVAIL, `${d.doc.fichier}-${lang}.html`);
  const pied = `<div style="width:100%;font:8pt 'Source Sans 3',Arial,sans-serif;color:#555A62;padding:0 15mm;display:flex;justify-content:space-between">` +
    `<span>${echappe(config.name)} · ${echappe(d.doc.titre)}</span><span class="pageNumber"></span></div>`;
  const ouvrir = async (html) => {
    writeFileSync(fichierHtml, html);
    await page.goto(pathToFileURL(fichierHtml).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
  };
  // le corps, sans la couverture, avec le pied de page et les signets
  const corps = async (chemin) => {
    await page.evaluate(() => document.querySelector(".couverture").remove());
    await page.pdf({ path: chemin, format: "A4", printBackground: true, tagged: true, outline: true, margin: MARGES,
      displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: pied });
  };
  const corpsPdf = join(TRAVAIL, "corps.pdf"), couvPdf = join(TRAVAIL, "couverture.pdf");
  // 1re impression : où tombe chaque titre
  await ouvrir(pageHtml(lang, d, null));
  await corps(corpsPdf);
  const numeros = JSON.parse(execFileSync(PYTHON, ["-c", PY_NUMEROS, corpsPdf, "0"]).toString());
  const sansNumero = [...pageHtml(lang, d, null).matchAll(/<a href="#([^"]+)">/g)].map((m) => m[1]).filter((id) => !numeros[id]);
  if (sansNumero.length) { console.error(`${d.doc.fichier}-${lang} : sommaire sans numéro de page pour ${sansNumero.slice(0, 5).join(", ")}`); process.exit(1); }
  // 2e impression, avec les numéros (largeur réservée : rien ne bouge), puis la couverture seule
  await ouvrir(pageHtml(lang, d, numeros));
  await page.pdf({ path: couvPdf, format: "A4", printBackground: true, tagged: true, margin: MARGES, pageRanges: "1" });
  await corps(corpsPdf);
  const sortie = join(SORTIE, `${d.doc.fichier}-${lang}.pdf`);
  execFileSync(PYTHON, ["-c", PY_REUNIR, couvPdf, corpsPdf, sortie, `${config.name} – ${d.doc.titre}`, config.name]);
  const verif = JSON.parse(execFileSync(PYTHON, ["-c", PY_NUMEROS, sortie, "1"]).toString());
  // chaque lien interne mène à une page écrite en clair, la bonne
  const PY_LIENS = `
import sys
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
pages = {p.indirect_reference.idnum: i for i, p in enumerate(r.pages)}
n = mauvais = 0
for p in r.pages:
    for ref in p.get("/Annots") or []:
        a = ref.get_object()
        if a.get("/Subtype") == "/Link" and "/Dest" in a:
            n += 1
            d = a["/Dest"]
            if not hasattr(d, "__len__") or isinstance(d, str) or d[0].idnum not in pages:
                mauvais += 1
print(n, mauvais)
`;
  const [liens, mauvais] = execFileSync(PYTHON, ["-c", PY_LIENS, sortie]).toString().trim().split(" ").map(Number);
  if (!liens || mauvais) { console.error(`${sortie} : ${mauvais} lien(s) interne(s) sur ${liens} sans page en clair`); process.exit(1); }
  const ecarts = Object.keys(numeros).filter((k) => verif[k] !== numeros[k]);
  if (ecarts.length) { console.error(`${sortie} : numéros du sommaire faux pour ${ecarts.slice(0, 5).join(", ")}`); process.exit(1); }
  await page.close();
  return sortie;
}

// ── La fiche pour l'IT ───────────────────────────────────────────────────────────────────────────────────────
// « Ce qu'il faut préparer » (docs/it_request.md de l'outil et sa version française), seule, mise en page de fiche :
// A4, ni couverture ni sommaire, un en-tête sobre (produit, titre, adresse du site), un pied de page avec l'adresse
// de la documentation IT et le numéro de page ; lisible imprimée en noir et blanc ; ni date ni numéro de version.
// Mêmes coupes que la page /docs/ (src/lib/docs-outil.mjs). La fabrication échoue si la fiche dépasse 2 pages, si une
// page est presque vide, ou si un élément déborde de la largeur de la page.
const PAGES_FICHE_MAX = 2;
const CSS_FICHE = CSS.slice(0, CSS.indexOf(":root")) + `
:root { --encre: #111418; --doux: #3F444B; --filet: #B9B6AE; --fond: #EDEDEB; --marque: #334155; }
@page { size: A4; margin: 10mm 12mm 13mm; }
* { box-sizing: border-box; }
html { font-family: "Source Sans 3", Arial, sans-serif; font-size: 8.8pt; line-height: 1.3; color: var(--encre); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; }
.tete { display: flex; align-items: flex-end; justify-content: space-between; gap: 6mm; padding-bottom: 2.2mm; margin-bottom: 3mm; border-bottom: 0.7mm solid var(--marque); }
.tete .marque { margin: 0; display: flex; align-items: center; gap: 1.6mm; font: 600 11pt/1 "Source Serif 4", serif; }
.tete .marque svg { width: 1.15em; height: 1.15em; }
.tete h1 { margin: 1.4mm 0 0; font: 600 15pt/1.15 "Source Serif 4", serif; letter-spacing: -0.01em; }
.tete .type { margin: 0 0 0.6mm; font: 700 8.5pt/1 "Source Sans 3", sans-serif; letter-spacing: .08em; text-transform: uppercase; color: var(--doux); }
.tete .adresse { margin: 0; font-size: 8.5pt; color: var(--doux); white-space: nowrap; }
h2 { font: 600 10.5pt/1.2 "Source Serif 4", serif; margin: 2.6mm 0 1.2mm; padding-top: 1.4mm; border-top: 0.3mm solid var(--filet); break-after: avoid; }
h2:first-of-type { border-top: 0; padding-top: 0; }
p { margin: 0 0 1.4mm; }
ul, ol { margin: 0 0 1.6mm; padding-left: 5mm; }
li { margin: 0 0 0.6mm; }
p, li { orphans: 2; widows: 2; }
p:has(+ table), p:has(+ pre) { break-after: avoid; } /* la phrase qui annonce un tableau reste avec lui */
strong { font-weight: 700; }
a { color: inherit; text-decoration: none; }
code { font-family: "DejaVu Sans Mono", Consolas, monospace; font-size: 0.95em; overflow-wrap: anywhere; }
pre { font-family: "DejaVu Sans Mono", Consolas, monospace; font-size: 8.5pt; line-height: 1.35; margin: 1mm 0 1.6mm; padding: 1.4mm 2mm; border: 0.3mm solid var(--filet); border-left: 0.9mm solid var(--marque); white-space: pre-wrap; overflow-wrap: anywhere; break-inside: avoid; }
pre code { font-size: inherit; }
table { width: 100%; border-collapse: collapse; margin: 0 0 2mm; font-size: 8.5pt; /* corps le plus petit de la fiche */ line-height: 1.3; }
th, td { text-align: left; vertical-align: top; padding: 0.7mm 1.5mm; border-bottom: 0.25mm solid var(--filet); }
thead th { background: var(--fond); border-bottom: 0.4mm solid var(--doux); font-weight: 700; }
tr { break-inside: avoid; }
td:first-child { font-weight: 600; }
table.coche td:first-child { font-weight: 400; white-space: nowrap; width: 1%; }
table.coche td:nth-child(2) { font-weight: 600; }
table.c2 th:first-child, table.c2 td:first-child { width: 25%; } /* deux colonnes : un nom court, puis le détail */
table.c3:not(.coche) th:first-child, table.c3:not(.coche) td:first-child { width: 15%; }
blockquote { margin: 0; }
`;
async function ficheIT(nav, lang) {
  const T = TEXTES[lang], D = DOCS_OUTIL[lang], F = T.fiche;
  const source = D.autres["it-request"].fichier;
  const texte = sansIA(nettoyer(ecarter(readFileSync(join(OUTIL, source), "utf8"), D)), source);
  const titre = (texte.match(/^# (.+)$/m) || [, F.titre])[1].trim();
  let html = (await md.render(texte.replace(/^# .+\n/, ""))).code;
  // en gras, la première colonne qui nomme ; dans un tableau à cocher (première colonne « Ready » / « Prêt »), la deuxième
  html = html.replace(/<table>(\s*<thead>\s*<tr>\s*<th>(?:Ready|Prêt)<\/th>)/g, '<table class="coche">$1');
  const site = config.url.replace(/^https?:\/\//, "");
  const docs = `${site}${lang === config.defaultLang ? "" : `/${lang}`}/docs/`;
  const page = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${echappe(`${config.name} – ${titre}`)}</title><style>${CSS_FICHE}</style></head><body>` +
    `<header class="tete"><div><p class="marque">${LOGO}${echappe(config.name)}</p><h1>${echappe(titre)}</h1></div>` +
    `<div><p class="type">${echappe(F.titre)}</p><p class="adresse">${echappe(site)}</p></div></header>${html}</body></html>`;
  const fichierHtml = join(TRAVAIL, `${F.fichier}-${lang}.html`);
  writeFileSync(fichierHtml, page);
  const onglet = await nav.newPage();
  // largeur de la page imprimée (A4 moins les marges, 96 px par pouce) : on y cherche ce qui déborde
  await onglet.setViewportSize({ width: Math.floor((210 - 24) / 25.4 * 96), height: 1100 });
  await onglet.emulateMedia({ media: "print" });
  await onglet.goto(pathToFileURL(fichierHtml).href, { waitUntil: "load" });
  await onglet.evaluate(() => document.fonts.ready);
  await onglet.evaluate(() => document.querySelectorAll("table").forEach((t) => t.classList.add(`c${t.rows[0].cells.length}`)));
  const debords = await onglet.evaluate(() => [...document.body.querySelectorAll("*")]
    .filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== "visible" || e.getBoundingClientRect().right > document.body.clientWidth + 1)
    .map((e) => `${e.tagName.toLowerCase()} « ${(e.textContent || "").trim().slice(0, 50)} »`));
  if (debords.length) { console.error(`${F.fichier}-${lang} : du texte déborde de la page : ${debords.slice(0, 5).join(" ; ")}`); process.exit(1); }
  const pied = `<div style="width:100%;font:8pt 'Source Sans 3',Arial,sans-serif;color:#3F444B;padding:0 12mm;display:flex;justify-content:space-between">` +
    `<span>${echappe(config.name)} · ${echappe(F.docs)} : ${echappe(docs)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  const sortie = join(SORTIE, `${F.fichier}-${lang}.pdf`);
  await onglet.pdf({ path: sortie, format: "A4", printBackground: true, tagged: true, margin: { top: "10mm", bottom: "13mm", left: "12mm", right: "12mm" },
    displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: pied.replace(" : ", lang === "fr" ? "\u00a0: " : ": ") });
  await onglet.close();
  const mesure = JSON.parse(execFileSync(PYTHON, ["-c", `
import sys, json
from pypdf import PdfReader, PdfWriter
r = PdfReader(sys.argv[1])
print(json.dumps([len((p.extract_text() or "").strip()) for p in r.pages]))
w = PdfWriter(clone_from=sys.argv[1])
w.add_metadata({"/Title": sys.argv[2], "/Author": sys.argv[3], "/Creator": "", "/Producer": ""})
with open(sys.argv[1], "wb") as f: w.write(f)
`, sortie, `${config.name} – ${titre}`, config.name]).toString());
  if (mesure.length > PAGES_FICHE_MAX) { console.error(`${sortie} : ${mesure.length} pages, ${PAGES_FICHE_MAX} au plus`); process.exit(1); }
  const vides = mesure.map((n, i) => [n, i + 1]).filter(([n]) => n < 300).map(([, i]) => i);
  if (vides.length) { console.error(`${sortie} : page(s) presque vide(s) : ${vides.join(", ")}`); process.exit(1); }
  return { sortie, pages: mesure.length };
}

const nav = await chromium.launch();
try {
  for (const lang of LANGUES) {
    if (!TEXTES[lang]) { console.error(`Langue sans textes de manuel : ${lang}`); process.exit(2); }
    if (SEULEMENT !== "fiche") for (const fabrique of [manuelUtilisation, manuelIT]) {
      numeroFigure = 0;
      const d = await fabrique(lang);
      const sortie = await imprimer(nav, lang, d);
      const pages = execFileSync(PYTHON, ["-c", "import sys;from pypdf import PdfReader;print(len(PdfReader(sys.argv[1]).pages))", sortie]).toString().trim();
      console.log(`${lang} · ${d.doc.titre} · ${pages} pages · ${numeroFigure} figures · ${(statSync(sortie).size / 1024).toFixed(0)} Ko`);
    }
    if (SEULEMENT !== "manuels") {
      const f = await ficheIT(nav, lang);
      console.log(`${lang} · ${TEXTES[lang].fiche.titre} · ${f.pages} page(s) · ${(statSync(f.sortie).size / 1024).toFixed(0)} Ko`);
    }
  }
} finally {
  await nav.close();
  if (GARDER) console.log(`HTML intermédiaire gardé dans ${TRAVAIL}`); else rmSync(TRAVAIL, { recursive: true, force: true });
}
console.log(`\nPDF écrits dans ${SORTIE}.`);
