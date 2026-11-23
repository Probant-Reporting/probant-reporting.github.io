// Captures par section + essai de l'interaction du bac à sable, sur l'accueil de chaque langue du site.
// Usage : node qa/sections.mjs <dossier> [largeur] [light|dark]
// Fichiers : <largeur>-<section>.png pour la langue par défaut, <largeur>-<langue>-<section>.png pour les autres.
// La commande finit en échec si une page défile sur le côté ou écrit une erreur dans la console.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.BASE || "http://127.0.0.1:4321";
const out = process.argv[2], w = Number(process.argv[3] || 1280);
const b = await chromium.launch();
// l'accueil de chaque langue : « / » et « /<langue>/ », lus dans le plan du site
const plan = await (await fetch(base + "/sitemap.xml")).text();
const accueils = [...plan.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => /^\/(?:[a-z]{2}\/)?$/.test(p));
for (const accueil of accueils) {
  const lang = accueil.replace(/\//g, ""), nom = (id) => `${out}/${w}-${lang ? `${lang}-` : ""}${id}.png`;
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, colorScheme: process.argv[4] || "light", reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const erreurs = []; p.on("console", (m) => m.type() === "error" && erreurs.push(m.text())); p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(base + accueil, { waitUntil: "networkidle" });
  for (const id of ["try", "features", "roles", "free", "faq", "get", "contact"]) {
    await p.locator("#" + id).screenshot({ path: nom(id) });
  }
  // essai : saisir, valider (refus sans preuve), joindre, valider
  await p.locator('[data-ouvrir="elec"]').click();
  await p.fill("#sb-valeur", "412300");
  await p.click("[data-valider]");
  await p.locator("#try").screenshot({ path: nom("try-refus") });
  await p.setInputFiles("[data-fichier]", { name: "invoices-2026.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") });
  await p.click("[data-valider]");
  await p.locator("#try").screenshot({ path: nom("try-valide") });
  await p.click('[data-onglet="dashboard"]');
  await p.locator("#try").screenshot({ path: nom("try-dashboard") });
  await p.click('[data-onglet="consistency"]');
  await p.locator("#try").screenshot({ path: nom("try-consistency") });
  const large = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(`${accueil} défilement horizontal :`, large, "| erreurs :", erreurs);
  if (large || erreurs.length) process.exitCode = 1;
  await ctx.close();
}
await b.close();
