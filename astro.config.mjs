import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import config from "./site.config.mjs";
import { typoFr } from "./src/lib/typo.mjs";

// Pages en Markdown : {name} devient le nom du produit, les liens internes suivent l'adresse de base du site et la
// langue de la page (src/content/<langue>/… : « /get/ » devient « /fr/get/ » dans une page française), et chaque
// tableau est mis dans un cadre qui défile seul sur téléphone, nommé dans la langue de la page.
const base = config.base.endsWith("/") ? config.base : config.base + "/";
const parcourir = (n, f) => { f(n); (n.children || []).forEach((c) => parcourir(c, f)); };
const langueDe = (fichier) => (/[\\/]content[\\/]([^\\/]+)[\\/]/.exec(fichier?.path || fichier?.history?.[0] || "") || [])[1] || config.defaultLang;
// le mot « table » dans la langue de la page : src/content/<langue>/_site.json, common.table
const mots = {};
const motTableau = (lang) => (mots[lang] ??= (() => { try { return JSON.parse(readFileSync(new URL(`./src/content/${lang}/_site.json`, import.meta.url), "utf8")).common.table; } catch { return "table"; } })());
// un fichier servi tel quel (image, archive) n'a pas de version par langue ; le flux RSS en a une
const sansLangue = (url) => /\.[a-z0-9]+$/i.test(url.split(/[#?]/)[0]) && !/^\/rss\.xml$/.test(url);
// La documentation IT est une seule page, /docs/ (demande de Florent du 25/11/2026) : chaque fichier de
// src/content/<langue>/docs/ y devient une partie, d'ancre son nom. Un lien « /docs/<partie>/ » ou « /docs/<partie>/#x »
// devient « #<partie> » ou « #x » dans la documentation, et « /docs/#<partie> » ou « /docs/#x » ailleurs.
const estDoc = (fichier) => /[\\/]content[\\/][^\\/]+[\\/]docs[\\/]/.test(fichier?.path || fichier?.history?.[0] || "");
function lienDoc(url, dansDoc) {
  const m = /^\/docs\/([a-z0-9-]+)\/(?:#(.+))?$/.exec(url);
  if (!m) return url;
  const ancre = m[2] || m[1];
  return dansDoc ? `#${ancre}` : `/docs/#${ancre}`;
}
// Dans la documentation, les captures de l'outil ne sont pas reprises (npm run sync) : la phrase qui les annonçait
// (« La saisie fonctionne aussi sur téléphone : ») finirait sur deux-points sans rien derrière. Un paragraphe qui finit
// par « : » et que ne suit ni liste, ni code, ni tableau, ni citation finit par un point.
function deuxPointsOrphelins(arbre) {
  const enfants = arbre.children || [];
  enfants.forEach((n, i) => {
    if (n.type !== "paragraph") return;
    const suivant = enfants[i + 1];
    if (suivant && ["list", "code", "table", "blockquote", "html"].includes(suivant.type)) return;
    const dernier = n.children?.[n.children.length - 1];
    if (dernier?.type === "text" && /\s?:\s*$/.test(dernier.value)) dernier.value = dernier.value.replace(/\s?:\s*$/, ".");
  });
}
function remarkProbant() {
  return (arbre, fichier) => {
    const lang = langueDe(fichier), prefixe = lang === config.defaultLang ? "" : `${lang}/`, dansDoc = estDoc(fichier);
    if (dansDoc) deuxPointsOrphelins(arbre);
    parcourir(arbre, (n) => {
      if (typeof n.value === "string") n.value = n.value.replaceAll("{name}", config.name);
      if (n.type === "link") n.url = lienDoc(n.url, dansDoc);
      if (n.type === "link" && n.url.startsWith("/") && !n.url.startsWith("//")) n.url = base + (sansLangue(n.url) ? "" : prefixe) + n.url.slice(1);
    });
  };
}
// Dans la page unique de la documentation, le titre de chaque partie est un h2 : les titres d'un fichier descendent d'un
// niveau (h2 → h3, h3 → h4). Un intertitre dont l'ancre est déjà prise par une autre partie de la page reçoit l'ancre
// que l'en-tête « ids » lui donne (titre → ancre, écrit par npm run sync) ; Astro garde un id déjà posé.
const texteDe = (n) => (n.type === "text" ? n.value : (n.children || []).map(texteDe).join(""));
function rehypeDocs() {
  return (arbre, fichier) => {
    if (!estDoc(fichier)) return;
    const ids = fichier?.data?.astro?.frontmatter?.ids || {};
    parcourir(arbre, (n) => {
      if (n.type !== "element" || !/^h[2-5]$/.test(n.tagName)) return;
      const id = ids[texteDe(n).trim()];
      if (id) n.properties = { ...n.properties, id };
      n.tagName = `h${Number(n.tagName[1]) + 1}`;
    });
  };
}
// Typographie française des pages françaises (src/lib/typo.mjs) : espaces insécables dans le texte, jamais dans le code.
function rehypeTypo() {
  const texte = (n, dansCode) => { if (n.type === "text" && !dansCode) n.value = typoFr(n.value); (n.children || []).forEach((c) => texte(c, dansCode || n.tagName === "code" || n.tagName === "pre")); };
  return (arbre, fichier) => { if (langueDe(fichier) === "fr") texte(arbre, false); };
}
function rehypeTableaux() {
  // sans titre au-dessus, un tableau est nommé d'après sa page : dans la documentation d'un seul tenant, « Tableau 1 »
  // reviendrait dans chaque partie
  return (arbre, fichier) => { let n = 0; const mot = motTableau(langueDe(fichier)); let titre = (fichier?.data?.astro?.frontmatter?.title || "").replaceAll("{name}", config.name); if (langueDe(fichier) === "fr") titre = typoFr(titre); parcourir(arbre, (noeud) => {
    if (noeud.type === "element" && /^h[234]$/.test(noeud.tagName)) titre = (noeud.children || []).map((c) => c.value || (c.children || []).map((x) => x.value || "").join("")).join("").trim();
    if (noeud.properties?.className?.includes?.("tableau-defile")) return; // déjà dans son cadre
    if (noeud.type === "element" && noeud.tagName === "pre") noeud.properties = { ...noeud.properties, tabIndex: 0 }; // code qui défile : atteignable au clavier
    (noeud.children || []).forEach((c, i) => {
      if (c.type === "element" && c.tagName === "table") noeud.children[i] = { type: "element", tagName: "div", properties: { className: ["tableau-defile"], tabIndex: 0, role: "region", ariaLabel: titre ? `${titre} (${mot} ${++n})` : `${mot[0].toUpperCase()}${mot.slice(1)} ${++n}` }, children: [c] };
    });
  }); };
}

// Pages dont l'en-tête porte « replis: true » : chaque partie (titre de niveau 2 et ce qui suit) se replie et se
// déplie, pour que les méthodes se lisent une par une (demande de Florent du 23/11/2026).
function rehypeReplis() {
  return (arbre, fichier) => {
    const fm = fichier?.data?.astro?.frontmatter;
    if (!fm?.replis) return;
    const enfants = arbre.children, sortie = [];
    let courant = null;
    for (const n of enfants) {
      if (n.type === "element" && n.tagName === "h2") {
        courant = { type: "element", tagName: "details", properties: { className: ["repli", "repli-section"], open: sortie.filter((x) => x.tagName === "details").length === 0 },
          children: [{ type: "element", tagName: "summary", properties: {}, children: [n] }] };
        sortie.push(courant);
      } else if (courant) courant.children.push(n);
      else sortie.push(n);
    }
    arbre.children = sortie;
  };
}

export default defineConfig({
  site: config.url,
  base: config.base,
  trailingSlash: "always",
  build: { inlineStylesheets: "always", assets: "assets" },
  compressHTML: true,
  devToolbar: { enabled: false },
  markdown: { remarkPlugins: [remarkProbant], rehypePlugins: [rehypeDocs, rehypeTypo, rehypeTableaux, rehypeReplis], syntaxHighlight: false },
});
