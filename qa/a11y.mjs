// Contrôle d'accessibilité (axe-core, règles WCAG 2.1 A et AA) sur chaque page de chaque langue, en clair et en sombre,
// bureau et téléphone, y compris la page introuvable et, sur l'accueil de chaque langue, l'essai avec son panneau ouvert.
// Usage : npm run build && npm run preview, puis node qa/a11y.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axe = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const base = process.env.BASE || "http://127.0.0.1:4321";
const b = await chromium.launch();
let total = 0;
async function analyser(p, nom) {
  await p.evaluate(axe);
  const r = await p.evaluate(() => window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }));
  const debord = await p.evaluate(() => [...document.querySelectorAll(".defile")].filter((d) => d.scrollWidth > d.clientWidth + 1).length + (document.documentElement.scrollWidth > innerWidth ? 1 : 0));
  if (debord) { total += debord; console.log(`${nom}: ${debord} element(s) scroll horizontally`); }
  for (const v of r.violations) { total += v.nodes.length; console.log(`${nom}: ${v.id} (${v.impact}) ×${v.nodes.length} – ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " :: " + (n.any[0]?.message || "")).join("\n   ")}`); }
}
// toutes les pages du plan du site (sitemap.xml)
const plan = await (await fetch(base + "/sitemap.xml")).text();
const pages = [...plan.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
// l'accueil de chaque langue (« / », « /fr/ ») : l'essai et l'assistant d'installation y sont essayés
const accueils = pages.filter((p) => /^\/(?:[a-z]{2}\/)?$/.test(p));
pages.push("/404.html");
for (const scheme of ["light", "dark"]) for (const width of [1280, 768, 360, 320]) {
  const ctx = await b.newContext({ viewport: { width, height: 800 }, colorScheme: scheme, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  for (const page of pages) {
    await p.goto(base + page, { waitUntil: "networkidle" });
    await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await analyser(p, `${scheme} ${width} ${page}`);
  }
  for (const accueil of accueils) {
    const ou = `${scheme} ${width} ${accueil}`;
    await p.goto(base + accueil, { waitUntil: "networkidle" });
    await p.click('[data-ouvrir="elec"]'); await p.fill("#sb-valeur", "900000"); await p.click("[data-valider]");
    await analyser(p, `${ou} sandbox panel`);
    await p.keyboard.press("Escape");
    for (const o of ["dashboard", "consistency"]) { await p.click(`[data-onglet="${o}"]`); await analyser(p, `${ou} sandbox ${o}`); }
    await p.click(`[data-role="auditor"]`); await p.click('[data-onglet="entry"]'); await p.click('[data-ouvrir="elec"]');
    await analyser(p, `${ou} sandbox auditor`);
    // assistant d'installation d'un référentiel : écrans 2 et 3, et fin
    await p.click('[data-modele="VS_BASE"]'); await p.waitForSelector("[data-ins-continuer]"); await analyser(p, `${ou} installer KPIs`);
    await p.click("[data-ins-continuer]"); await analyser(p, `${ou} installer summary`);
    await p.click("[data-ins-installer]"); await analyser(p, `${ou} installer done`);
    // visite guidée (même langue) : la courte animation de l'outil, lancée par son bouton (avec « réduire les animations », elle ne démarre pas seule)
    await p.goto(base + accueil + "tour/", { waitUntil: "networkidle" });
    await p.click("[data-boucle-pause]"); await p.waitForTimeout(600); await analyser(p, `${ou} tour, tool animation playing`);
  }
  await ctx.close();
}
await b.close();
console.log(total ? `${total} problem(s).` : `No accessibility problem found by axe-core (${pages.length} pages, ${accueils.length} language(s)).`);
process.exit(total ? 1 : 0);
