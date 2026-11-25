// Essai au clavier et sans JavaScript, dans chaque langue du site. Usage : npm run preview, puis node qa/keyboard.mjs
// Les textes attendus sont ceux de chaque langue ; les nombres suivent ses usages (412,300 en anglais, 412 300 en
// français, où la virgule sépare les décimales).
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.BASE || "http://127.0.0.1:4321";
const LANGUES = {
  en: { accueil: "/", lu: "412,300", refus: "read as 412", brouillon: "900,000", commentaire: "comment", siege: "Head office", decimale: "900000.4", autre: "fr", autreAccueil: "/fr/", pause: "Pause", lecture: "Play" },
  fr: { accueil: "/fr/", lu: "412 300", refus: "lue comme 412", brouillon: "900 000", commentaire: "commentaire", siege: "Siège", decimale: "900000,4", autre: "en", autreAccueil: "/", pause: "Pause", lecture: "Lecture" },
};
const b = await chromium.launch();
// une espace insécable ou fine se compare comme une espace
const lisse = (t) => t.replace(/[  ]/g, " ");
for (const [lang, L] of Object.entries(LANGUES)) {
  const ok = (c, m) => { console.log(c ? "ok  " : "FAIL", `[${lang}] ${m}`); if (!c) process.exitCode = 1; };
  let p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base + L.accueil);
  ok((await p.evaluate(() => document.documentElement.lang)) === lang, `the page declares the language "${lang}"`);
  await p.keyboard.press("Tab");
  ok(await p.evaluate(() => document.activeElement.classList.contains("skip")), "first Tab stop is the skip link");
  await p.locator('[data-ouvrir="elec"]').focus(); await p.keyboard.press("Enter");
  ok(await p.evaluate(() => document.activeElement.id === "sb-valeur"), "Enter on a row opens the panel, focus on the value");
  await p.keyboard.type("900000");
  ok((await p.locator("[data-ecart]").innerText()).includes("109"), "variance vs N-1 updates while typing");
  await p.fill("#sb-valeur", L.decimale);
  ok((await p.locator("[data-ecart]").innerText()).includes("109"), `${L.decimale}: the decimal separator of the language is accepted`);
  await p.fill("#sb-valeur", "412.300");
  ok(lisse(await p.locator("[data-format]").innerText()).includes(L.lu), "412.300: the hint under the field says how the value is read");
  await p.click("[data-valider]");
  ok(lisse(await p.locator("#sb-erreur").innerText()).includes(L.refus) && await p.evaluate(() => document.activeElement.id === "sb-valeur" && document.activeElement.getAttribute("aria-describedby").includes("sb-erreur")), "412.300: validation refused, error tied to the field");
  await p.fill("#sb-valeur", "900 000 kWh");
  ok((await p.locator("[data-ecart]").innerText()).includes("109"), "a typed unit is accepted");
  await p.keyboard.press("Escape");
  ok(await p.evaluate(() => document.activeElement.dataset.ouvrir === "elec"), "Escape closes the panel, focus back on the row");
  ok(lisse(await p.locator("tr.ligne").first().innerText()).includes(L.brouillon), "closing saves the entry as a draft, shown in the number format of the language");
  await p.keyboard.press("Enter"); await p.fill("#sb-valeur", "900000");
  await p.click("[data-exemple]");
  await p.click("[data-valider]");
  ok((await p.locator("[data-erreur]").innerText()).includes(L.commentaire), "variance beyond 20% without comment: validation refused");
  ok(await p.evaluate(() => document.activeElement.id === "sb-commentaire"), "focus goes to the comment");
  await p.fill("#sb-commentaire", "New production line."); await p.click("[data-valider]");
  await p.waitForTimeout(200);
  ok((await p.locator("#sandbox-annonce").innerText()).length > 0, "validation announced");
  await p.click('[data-onglet="consistency"]');
  ok((await p.locator("#sb-vue").innerText()).includes(L.siege), "the justified alert is listed in Consistency");
  await p.click(`[data-role="auditor"]`); await p.click('[data-onglet="entry"]'); await p.click('[data-ouvrir="elec"]');
  ok((await p.locator(".panneau button").count()) === 1, "auditor: the panel has no button except Close");
  // menu des langues, au clavier : il mène à la même page dans l'autre langue, depuis l'en-tête et depuis le pied de page
  await p.goto(base + L.accueil + "docs/install-the-tool/");
  await p.locator(".lang-menu summary").focus(); await p.keyboard.press("Enter");
  const lien = p.locator(`.lang-menu a[hreflang="${L.autre}"]`);
  ok(await lien.isVisible() && (await lien.getAttribute("lang")) === L.autre, "language menu: opens with Enter, the other language is named in its own language");
  await lien.focus();
  await Promise.all([p.waitForURL((u) => u.pathname.startsWith(L.autreAccueil + "docs/"), { timeout: 10000 }).catch(() => {}), p.keyboard.press("Enter")]);
  ok(new URL(p.url()).pathname === `${L.autreAccueil}docs/install-the-tool/` && (await p.evaluate(() => document.documentElement.lang)) === L.autre, "language menu: leads to the same page in the other language");
  await p.goto(base + L.accueil + "glossary/");
  ok((await p.locator(`header a[hreflang="${L.autre}"]`).first().getAttribute("href")) === `${L.autreAccueil}glossary/`, "header: link to the same page in the other language");
  // jamais de vrais écrans sur l'accueil : l'animation de l'outil est dans la visite guidée
  await p.goto(base + L.accueil);
  ok((await p.locator("[data-boucle], .boucle-cadre").count()) === 0, "home page: no real screens of the tool (the animation is in the guided tour)");
  // courte animation de l'outil (en tête de la visite guidée) : elle démarre à l'écran, et le bouton Pause se manie au clavier
  await p.goto(base + L.accueil + "tour/");
  const boucle = p.locator("[data-boucle]"), bouton = p.locator("[data-boucle-pause]");
  await boucle.scrollIntoViewIfNeeded();
  await p.waitForFunction(() => document.querySelectorAll(".boucle-cadre img").length === 5, null, { timeout: 5000 }).catch(() => {});
  ok((await p.locator(".boucle-cadre img").count()) === 5 && (await bouton.innerText()).startsWith(L.pause), "tool animation: starts when it is on screen, with a Pause button");
  ok((await p.locator(".boucle-cadre img[alt]:not([alt=''])").count()) === 1, "tool animation: one text alternative for the whole sequence, the other images are decorative");
  await bouton.focus(); await p.keyboard.press("Enter");
  const arretee = await p.locator(".boucle-image.actif").getAttribute("src");
  await p.waitForTimeout(3800);
  ok((await bouton.innerText()).startsWith(L.lecture) && (await p.locator("[data-boucle-etat]").innerText()).length > 0 && (await p.locator(".boucle-image.actif").getAttribute("src")) === arretee, "tool animation: Enter on the button pauses it, the pause is announced, the image stays");
  await p.keyboard.press("Enter");
  ok((await bouton.innerText()).startsWith(L.pause), "tool animation: Enter again plays it");
  // visite guidée par rôle : le sommaire mène à chaque rôle, au clavier, et l'adresse porte l'ancre du rôle
  await p.goto(base + L.accueil + "tour/");
  const roles = await p.locator(".visite-roles a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  ok(roles.join(" ") === "#administrator #contributor #validator #reader #auditor" && (await p.evaluate((ids) => ids.every((i) => document.querySelector(`section${i} h2`)), roles)), "guided tour: the list of roles links to the five role sections");
  await p.locator('.visite-roles a[href="#auditor"]').focus(); await p.keyboard.press("Enter");
  const arrive = () => { const r = document.querySelector("#auditor").getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight / 2; };
  await p.waitForFunction(arrive, null, { timeout: 6000 }).catch(() => {}); // le défilement est doux : il prend plus d'une seconde
  ok(new URL(p.url()).hash === "#auditor" && (await p.evaluate(arrive)), "guided tour: Enter on a role goes to its section, below the header, and the address has its anchor");
  ok((await p.locator(".visite-etape").count()) >= 15 && (await p.locator(".visite-zoom").evaluateAll((as) => as.every((a) => a.getAttribute("href") === a.querySelector("img").getAttribute("src") && a.querySelector("img").alt.length > 60))), "guided tour: every capture has a text alternative and opens in full size");
  await p.close();

  // les films : rien ne démarre tout seul, chacun a son image d'attente, son nom accessible et sa transcription
  p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base + L.accueil + "videos/");
  const films = await p.locator("video").evaluateAll((vs) => vs.map((v) => ({
    auto: v.hasAttribute("autoplay") || v.hasAttribute("loop"),
    controles: v.hasAttribute("controls"),
    attente: (v.getAttribute("poster") || "").endsWith(".webp"),
    nomme: !!document.getElementById(v.getAttribute("aria-labelledby") || "")?.textContent.trim(),
    source: (v.querySelector("source")?.getAttribute("src") || "").endsWith(".mp4"),
  })));
  ok(films.length === 7 && films.every((f) => !f.auto && f.controles && f.attente && f.nomme && f.source),
    "videos: seven films, none starts on its own, each has controls, a poster and a name");
  const etapes = await p.locator("video").evaluateAll((vs) => vs.map((v) => {
    const d = document.getElementById(v.getAttribute("aria-describedby") || "");
    return { lie: !!d, pas: d ? d.querySelectorAll("li").length : 0, cache: d ? getComputedStyle(d).position === "absolute" : false };
  }));
  ok(etapes.length === 7 && etapes.every((e) => e.lie && e.pas >= 4 && e.cache) && etapes.reduce((n, e) => n + e.pas, 0) >= 30,
    "videos: a silent film carries its steps in the page, tied to it and never shown");
  await p.close();

  // avec « réduire les animations » : l'image fixe seule, rien d'autre n'est chargé, et le bouton propose la lecture
  const calme = await b.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });
  p = await calme.newPage(); await p.goto(base + L.accueil + "tour/");
  await p.locator("[data-boucle]").scrollIntoViewIfNeeded(); await p.waitForTimeout(3500);
  ok((await p.locator(".boucle-cadre img").count()) === 1 && (await p.locator("[data-boucle-pause]").innerText()).startsWith(L.lecture), "reduced motion: the tool animation does not start, one still image, a Play button");
  await calme.close();
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  p = await ctx.newPage(); await p.goto(base + L.accueil);
  const invisibles = await p.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3, main p, main li")].filter((e) => getComputedStyle(e).opacity === "0" || (e.offsetParent === null && !e.closest("details:not([open])") && !e.classList.contains("toast") && !e.closest("[data-js-seul]") && !e.closest("[data-variante]"))).length);
  ok(invisibles === 0, "without JavaScript: every text is visible");
  ok(await p.locator("#sandbox table").isVisible(), "without JavaScript: the trial shows its starting table");
  await p.locator(".lang-menu summary").click();
  ok(await p.locator(`.lang-menu a[hreflang="${L.autre}"]`).isVisible(), "without JavaScript: the language menu opens");
  await p.goto(base + L.accueil + "tour/#validator");
  ok(await p.locator(".boucle-cadre img").isVisible() && (await p.locator(".boucle-etapes li").count()) === 5 && !(await p.locator("[data-boucle-pause]").isVisible()), "without JavaScript: the tool animation of the guided tour is one still image with its five steps, and no button");
  ok(await p.locator("#validator h2").isVisible() && (await p.locator(".visite-roles a").count()) === 5 && (await p.locator(".visite-image").count()) >= 15, "without JavaScript: the guided tour shows every role, its list of roles and its captures");
  await ctx.close();
}
// page introuvable : les deux langues, chacune avec son lien vers son accueil
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(base + "/404.html");
for (const [lang, L] of Object.entries(LANGUES)) {
  const n = await p.locator(`.bloc-404 a[hreflang="${lang}"][href="${L.accueil}"]`).count();
  console.log(n === 1 ? "ok  " : "FAIL", `[404] the "not found" page offers the home page in "${lang}"`); if (n !== 1) process.exitCode = 1;
}
await b.close();
