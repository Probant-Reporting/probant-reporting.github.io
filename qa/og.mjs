// Fabrique l'image de partage (public/og.png) avec le nom du produit de site.config.mjs, et les icônes en PNG du logo
// (public/apple-touch-icon.png, public/favicon-48.png) pour les appareils qui ne lisent pas le SVG. Usage : npm run og
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import config from "../site.config.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");
const police = (f) => `data:font/woff2;base64,${readFileSync(new URL(`../public/fonts/${f}`, import.meta.url)).toString("base64")}`;
const titre = JSON.parse(readFileSync(new URL(`../src/content/${config.defaultLang}/${config.homeTheme}.json`, import.meta.url))).hero.title;
const html = `<style>
@font-face{font-family:S;src:url(${police("source-serif-4-latin-600-normal.woff2")})}
body{margin:0;width:1200px;height:630px;background:#F8F7F3;color:#171A1F;font-family:S,serif;display:flex;flex-direction:column;justify-content:space-between;padding:72px 80px;box-sizing:border-box;
background-image:repeating-linear-gradient(to bottom,transparent 0 44px,#E6E3DA 44px 45px)}
.m{display:flex;align-items:center;gap:18px;font-size:54px}.m svg{width:60px;height:60px}
h1{font-size:104px;line-height:1.02;letter-spacing:-.02em;margin:0;max-width:900px}
</style><div class="m"><svg viewBox="0 0 32 32"><rect x="3" y="8" width="21" height="21" rx="4" fill="none" stroke="#171A1F" stroke-width="2.5"/><path d="M9 18.5l5 5L29 5.5" fill="none" stroke="#334155" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>${config.name}</div><h1>${titre}</h1>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: new URL("../public/og.png", import.meta.url).pathname });
// icônes : le logo sur le fond clair du site, avec une marge (un écran d'accueil arrondit les coins)
for (const [fichier, cote] of [["apple-touch-icon.png", 180], ["favicon-48.png", 48]]) {
  await p.setViewportSize({ width: cote, height: cote });
  await p.setContent(`<style>body{margin:0;width:${cote}px;height:${cote}px;background:#F8F7F3;display:grid;place-items:center}svg{width:72%;height:72%}</style><svg viewBox="0 0 32 32"><rect x="3" y="8" width="21" height="21" rx="4" fill="none" stroke="#171A1F" stroke-width="2.5"/><path d="M9 18.5l5 5L29 5.5" fill="none" stroke="#334155" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  await p.screenshot({ path: new URL(`../public/${fichier}`, import.meta.url).pathname });
}
await b.close();
console.log("public/og.png, public/apple-touch-icon.png, public/favicon-48.png");
