// Petits comportements communs : bouton clair / sombre, apparition douce, menu des langues.
const d = document.documentElement;
const sombre = () => (d.dataset.theme ? d.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
const boutons = [...document.querySelectorAll("[data-theme-toggle]")];
const libelles = () => boutons.forEach((b) => { const t = sombre() ? b.dataset.toLight : b.dataset.toDark; if ("texte" in b.dataset) b.textContent = t; else b.setAttribute("aria-label", t); });
libelles();
boutons.forEach((b) => b.addEventListener("click", () => {
  const v = sombre() ? "light" : "dark";
  d.dataset.theme = v;
  try { localStorage.setItem("theme", v); } catch (e) { /* stockage refusé : le choix vaut pour cette page */ }
  libelles();
}));

const cibles = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  cibles.forEach((c) => o.observe(c));
} else cibles.forEach((c) => c.classList.add("in"));

for (const menu of document.querySelectorAll(".lang-menu, .menu-mobile")) {
  document.addEventListener("click", (e) => { if (!menu.contains(e.target)) menu.open = false; });
  menu.addEventListener("keydown", (e) => { if (e.key === "Escape") { menu.open = false; menu.querySelector("summary").focus(); } });
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) menu.open = false; });
  menu.addEventListener("focusout", (e) => { if (e.relatedTarget && !menu.contains(e.relatedTarget)) menu.open = false; });
}

const mouvement = matchMedia("(prefers-reduced-motion: no-preference)");

// Courte animation de l'outil (ToolLoop.astro, en tête de la visite guidée) : cinq captures en fondu, en boucle. La page arrive avec l'image de la
// fin seulement ; les autres ne sont demandées qu'à l'approche du bloc, et jamais si la lecture ne démarre pas.
// Avec « réduire les animations », rien ne démarre : l'image fixe reste, le bouton propose « Lecture ».
// La lecture s'arrête par le bouton (au clavier comme à la souris), au survol de l'image et hors de l'écran.
for (const zone of document.querySelectorAll("[data-boucle]")) {
  const cadre = zone.querySelector(".boucle-cadre"), fixe = cadre.querySelector("img");
  const adresses = zone.dataset.images.split(" "), fin = adresses.length - 1;
  const etapes = [...zone.querySelectorAll(".boucle-etapes li")];
  const pause = zone.querySelector("[data-boucle-pause]"), libelle = pause.querySelector("[data-pause-libelle]"), etat = zone.querySelector("[data-boucle-etat]");
  const duree = (n) => (n === fin ? 3400 : 2600);
  let images = null, pretes = false, i = fin, arret = !mouvement.matches, survol = false, visible = false, minuterie = 0;
  const montrer = (n) => { i = n; images.forEach((im, j) => im.classList.toggle("actif", j === i)); etapes.forEach((e, j) => e.classList.toggle("actif", j === i)); };
  const suite = () => {
    clearTimeout(minuterie);
    if (arret || survol || !visible || !pretes) return;
    minuterie = setTimeout(() => { montrer((i + 1) % adresses.length); suite(); }, duree(i));
  };
  // les autres images, sous l'image fixe : décoratives (le texte alternatif de l'image fixe décrit toute la séquence)
  const charger = () => {
    if (images) return;
    zone.classList.add("demarree"); // l'étape en cours reste marquée dans la liste, même en pause
    images = adresses.map((a, j) => {
      if (j === fin) return fixe;
      const im = new Image(960, 880);
      im.className = j === 0 ? "boucle-image gauche" : "boucle-image"; im.alt = ""; im.decoding = "async"; im.src = a;
      cadre.insertBefore(im, fixe);
      return im;
    });
    Promise.all(images.map((im) => (im.decode ? im.decode().catch(() => {}) : null))).then(() => { pretes = true; suite(); });
  };
  const maj = (annoncer) => {
    libelle.textContent = arret ? pause.dataset.lectureTexte : pause.dataset.pauseTexte;
    zone.classList.toggle("en-lecture", !arret);
    if (annoncer) etat.textContent = arret ? etat.dataset.arret : etat.dataset.lecture;
    if (!arret && visible) charger();
    suite();
  };
  pause.hidden = false;
  pause.addEventListener("click", () => { arret = !arret; maj(true); });
  cadre.addEventListener("mouseenter", () => { survol = true; suite(); }); cadre.addEventListener("mouseleave", () => { survol = false; suite(); });
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; if (visible && !arret) charger(); suite(); }), { threshold: 0.35 }).observe(zone);
  else visible = true;
  maj();
}

// Les messages : onglets à lecture automatique (7 s), pause au survol, au focus et par le bouton.
// Clavier : flèches gauche et droite, Début, Fin (onglets horizontaux). Un clic ou une flèche arrête la lecture :
// le bouton devient « Play » et l'arrêt est annoncé aux lecteurs d'écran.
for (const zone of document.querySelectorAll("[data-onglets-auto]")) {
  const liste = zone.querySelector("[role=tablist]"), onglets = [...liste.querySelectorAll("[role=tab]")];
  const panneaux = onglets.map((o) => document.getElementById(o.getAttribute("aria-controls")));
  const pause = zone.querySelector("[data-pause]"), libelle = pause.querySelector("[data-pause-libelle]"), etat = zone.querySelector("[data-oa-etat]");
  const DUREE = 7000;
  let i = 0, debut = performance.now(), arret = !mouvement.matches, survol = false, visible = false;
  zone.classList.add("actif"); zone.classList.toggle("en-lecture", !arret); zone.querySelector(".oa-nav").hidden = false;
  const montrer = (n, focus) => {
    i = n; debut = performance.now();
    onglets.forEach((o, j) => { o.setAttribute("aria-selected", String(j === i)); o.tabIndex = j === i ? 0 : -1; o.style.setProperty("--jauge", "0%"); });
    panneaux.forEach((p, j) => { p.hidden = j !== i; p.setAttribute("aria-labelledby", onglets[j].id); });
    if (focus) onglets[i].focus();
  };
  const majPause = (annoncer) => {
    libelle.textContent = arret ? pause.dataset.lectureTexte : pause.dataset.pauseTexte;
    zone.classList.toggle("en-lecture", !arret);
    if (annoncer && etat) etat.textContent = arret ? etat.dataset.arret : etat.dataset.lecture;
  };
  const arreter = () => { const avant = arret; arret = true; majPause(!avant); };
  const tic = (t) => {
    const actif = !arret && !survol && visible;
    zone.classList.toggle("en-lecture", !arret);
    if (actif) { const p = Math.min(1, (t - debut) / DUREE); onglets[i].style.setProperty("--jauge", `${p * 100}%`); if (p >= 1) montrer((i + 1) % onglets.length); }
    else { debut = t - (parseFloat(onglets[i].style.getPropertyValue("--jauge")) || 0) / 100 * DUREE; if (arret) onglets[i].style.setProperty("--jauge", "100%"); }
    requestAnimationFrame(tic);
  };
  onglets.forEach((o, j) => {
    o.addEventListener("click", () => { arreter(); montrer(j); });
    o.addEventListener("keydown", (e) => {
      const pas = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (pas) { e.preventDefault(); arreter(); montrer((j + pas + onglets.length) % onglets.length, true); }
      else if (e.key === "Home" || e.key === "End") { e.preventDefault(); arreter(); montrer(e.key === "Home" ? 0 : onglets.length - 1, true); }
    });
  });
  pause.addEventListener("click", () => { arret = !arret; majPause(true); });
  zone.addEventListener("mouseenter", () => (survol = true)); zone.addEventListener("mouseleave", () => (survol = false));
  zone.addEventListener("focusin", () => (survol = true)); zone.addEventListener("focusout", (e) => { if (!zone.contains(e.relatedTarget)) survol = false; });
  new IntersectionObserver((es) => es.forEach((e) => (visible = e.isIntersecting)), { threshold: 0.3 }).observe(zone);
  // un lien vers un message (#evidence, #it…) ouvre son onglet
  const ouvrirAncre = () => { const j = panneaux.findIndex((p) => "#" + p.id === location.hash); if (j >= 0) { arreter(); montrer(j); requestAnimationFrame(() => zone.scrollIntoView({ block: "start" })); } };
  addEventListener("hashchange", ouvrirAncre);
  majPause(); montrer(0); ouvrirAncre(); requestAnimationFrame(tic);
}
