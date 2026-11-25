// Les guides et la documentation IT en PDF, dans la mise en page du site : deux documents par langue, à joindre à un
// courriel ou à imprimer. Demandé par Florent le 25/11/2026 (« voir en PDF les différents guides, dans le style du site »).
//
// Une seule commande, à lancer dans le dossier du site, après « npm run build » :
//   node qa/guide-pdfs.mjs
// Options : --dist dist (dossier construit) · --lang en,fr (langues à refaire) · --port 4466 (port libre)
//
// Elle sert le site construit, lit la page « Guides and IT documentation » pour savoir quelles pages entrent dans
// quel document et dans quel ordre, met leur contenu bout à bout, retire l'en-tête, le pied et les menus, puis
// imprime. Le style est celui du site : ses polices, ses couleurs, ses titres.
//
// Ce qu'elle écrit :
//   public/pdf/probant-guides-<langue>.pdf             les cinq guides par rôle
//   public/pdf/probant-it-documentation-<langue>.pdf   les pages de la documentation IT
// Les liens vers ces fichiers sont posés par src/components/GuidesIndex.astro. Aucun numéro de version et aucune
// date : un guide publié n'en porte pas.
import { createRequire } from "node:module";
import config from "../site.config.mjs";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const { chromium } = createRequire(import.meta.url)("playwright");

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const option = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const DIST = resolve(option("dist", join(SITE, "dist")));
const PORT = Number(option("port", "4466")), BASE = `http://127.0.0.1:${PORT}`;
const LANGUES = option("lang", "en,fr").split(",").map((x) => x.trim()).filter(Boolean);
const SORTIE = join(SITE, "public", "pdf");
if (!existsSync(join(DIST, "index.html"))) { console.error(`${DIST} : site non construit (npm run build)`); process.exit(2); }
mkdirSync(SORTIE, { recursive: true });

// Ce qui ne doit pas se retrouver dans un document imprimé, et la mise en page des pages mises bout à bout.
const CSS_IMPRESSION = `
  @page { size: A4; margin: 18mm 16mm 20mm; }
  .top, footer, .skip, .film-plein, .pdf-lien { display: none !important; }
  html, body { background: #fff !important; }
  main, .page, .docs { padding-block: 0 !important; }
  .wrap, .page .wrap { max-width: none !important; padding: 0 !important; }
  .pdf-page { break-before: page; }
  .pdf-page:first-child { break-before: auto; }
  .pdf-couverture { break-after: page; padding-top: 18mm; }
  .pdf-marque { font: 600 13pt/1.2 "Source Sans 3", sans-serif; letter-spacing: .02em; }
  .pdf-couverture h1 { margin-top: 4mm; font-size: 32pt; line-height: 1.05; }
  .pdf-sommaire { margin-top: 14mm; padding: 0; list-style: none; border-top: 1px solid #8a8880; max-width: 130mm; }
  .pdf-sommaire li { padding: 3.2mm 0; border-bottom: 1px solid #dad7ce; font-size: 12pt; }
  .pdf-adresse { margin-top: 12mm; font-size: 10pt; color: #555a62; }
  .pdf-page h1 { font-size: 21pt; margin: 0 0 4mm; }
  .prose h2 { break-after: avoid; } .prose h3 { break-after: avoid; }
  .prose pre, .prose table, .prose li { break-inside: avoid; }
  .docs-menu, .docs-toc, .fil, .doc-nav, .guides-cartes, .prose .repli summary ~ * { display: revert; }
  .docs-menu, .docs-toc { display: none !important; }
  a { color: inherit; text-decoration: none; }
  .prose a { text-decoration: underline; text-underline-offset: 2px; }
`;

async function servir() {
  const p = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: DIST, stdio: "ignore" });
  p.unref();
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + "/index.html"); if (r.ok) return p; } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("le site construit ne répond pas");
}

const prefixe = (lang) => (lang === "en" ? "" : `/${lang}`);

async function documents(page, lang) {
  await page.goto(`${BASE}${prefixe(lang)}/guides/index.html`, { waitUntil: "load" });
  return page.evaluate(() => [...document.querySelectorAll("#main section")].map((s) => ({
    titre: s.querySelector("h2")?.textContent.trim() || "",
    pages: [...s.querySelectorAll(".guides-cartes a")].map((a) => ({ href: a.getAttribute("href"), titre: a.querySelector("b")?.textContent.trim() || "" })),
  })));
}

async function imprimer(page, lang, titre, pages, fichier) {
  // on part de la première page : ses styles sont ceux du site
  await page.goto(new URL(pages[0].href, BASE).href, { waitUntil: "load" });
  const corps = [];
  for (const x of pages) {
    const url = new URL(x.href, BASE).href;
    const html = await page.evaluate(async (u) => {
      const t = await (await fetch(u)).text();
      const d = new DOMParser().parseFromString(t, "text/html");
      const m = d.querySelector("#main");
      for (const sel of [".docs-menu", ".docs-toc", ".fil", ".pdf-lien", "nav"]) m?.querySelectorAll(sel).forEach((e) => e.remove());
      return m ? m.innerHTML : "";
    }, url);
    corps.push(html);
  }
  const sommaire = pages.map((x) => x.titre).filter(Boolean);
  await page.evaluate(([titre, corps, css, sommaire, marque, adresse]) => {
    document.querySelectorAll(".top, footer, .skip").forEach((e) => e.remove());
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    const echappe = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const main = document.querySelector("#main");
    main.innerHTML = `<section class="page pdf-couverture"><div class="wrap">` +
      `<p class="pdf-marque">${echappe(marque)}</p><h1>${echappe(titre)}</h1>` +
      `<ol class="pdf-sommaire">${sommaire.map((t) => `<li>${echappe(t)}</li>`).join("")}</ol>` +
      `<p class="pdf-adresse">${echappe(adresse)}</p></div></section>` +
      corps.map((h) => `<div class="pdf-page">${h}</div>`).join("");
  }, [titre, corps, CSS_IMPRESSION, sommaire, config.name, config.url.replace(/^https?:\/\//, "")]);
  await page.waitForTimeout(400);
  await page.pdf({ path: fichier, format: "A4", printBackground: true, displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;font:9pt 'Source Sans 3',sans-serif;color:#555a62;padding:0 16mm;display:flex;justify-content:space-between"><span>${titre}</span><span class="pageNumber"></span></div>`,
    margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" } });
  return (statSync(fichier).size / 1024).toFixed(0) + " Ko";
}

const serveur = await servir();
const nav = await chromium.launch({ args: ["--no-proxy-server"] });
try {
  for (const lang of LANGUES) {
    const c = await nav.newContext({ viewport: { width: 1100, height: 1400 }, colorScheme: "light" });
    const page = await c.newPage(); page.setDefaultTimeout(30000);
    const docs = await documents(page, lang);
    const noms = ["guides", "it-documentation"];
    for (const [i, d] of docs.entries()) {
      if (!d.pages.length) continue;
      const fichier = join(SORTIE, `probant-${noms[i] || `doc-${i}`}-${lang}.pdf`);
      const poids = await imprimer(page, lang, d.titre, d.pages, fichier);
      console.log(`${lang} · ${d.titre} · ${d.pages.length} pages · ${poids}`);
    }
    await c.close();
  }
} finally {
  await nav.close();
  try { serveur.kill("SIGTERM"); } catch (e) {}
}
console.log(`\nPDF écrits dans ${SORTIE}.`);
