// Assistant d'installation d'un référentiel : 3 écrans comme dans l'outil (modèle, KPI, installer).
// Rien n'est enregistré : l'état vit dans la page.
const racine = document.getElementById("installateur");
if (racine) demarrer(racine);

function demarrer(racine) {
  const D = JSON.parse(document.getElementById("installateur-donnees").textContent);
  const T = D.T;
  // le détail d'un modèle (thèmes et KPI) n'est pas dans la page : il est chargé au choix du modèle (D.urlDetail), puis gardé
  const details = {};
  let K = {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const txt = (s, o = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (k in o ? o[k] : ""));
  const COCHE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  let etat = { ecran: 1, modele: null, coches: new Set(), filtre: "", fait: false, nom: "" };
  const modele = () => ({ ...D.templates.find((t) => t.id === etat.modele), ...details[etat.modele] });
  const couleur = () => D.couleurs[D.templates.findIndex((t) => t.id === etat.modele) % 4];
  const tous = () => modele().themes.flatMap((th) => th.kpis);
  // KPI ajoutés quand même : sources non cochées d'un KPI calculé coché (dans ce modèle)
  function ajoutes() {
    const dans = new Set(tous()), m = new Map();
    const voir = (c, par) => { for (const s of K[c].s) if (dans.has(s) && !etat.coches.has(s)) { if (!m.has(s)) m.set(s, new Set()); m.get(s).add(par); voir(s, par); } };
    for (const c of etat.coches) voir(c, K[c].n);
    return m;
  }
  const etapes = () => `<nav class="etapes-installation" aria-label="${esc(T.stepsAria)}"><ol class="etapes-numerotees">${T.steps.map((s, i) => { const n = i + 1, faite = n < etat.ecran || etat.fait, act = n === etat.ecran && !etat.fait;
    return `<li class="${act ? "actuelle" : faite ? "faite" : ""}"${act ? ' aria-current="step"' : ""}><span class="num" aria-hidden="true">${faite ? COCHE : n}</span><span class="texte"><span class="visually-hidden">${esc(txt(faite ? T.stepDone : T.stepOf, { n }))} </span>${esc(s)}</span></li>`; }).join("")}</ol></nav>`;
  const tete = (titre, pastille) => `<div class="tete-installation"><h3 class="titre-installation" tabindex="-1">${pastille ? `<span class="pastille-ref grande" style="--c-ref:${couleur()}" aria-hidden="true"></span> ` : ""}${esc(titre)}</h3>${etapes()}</div>`;

  function ecran1() {
    return `${tete(T.title)}<ul class="grille-modeles">${D.templates.map((t, i) => `<li class="carte carte-modele" style="--c-ref:${D.couleurs[i % 4]}"><h4><span class="pastille-ref grande" aria-hidden="true"></span> ${esc(t.name)}</h4><details class="repli repli-modele"><summary>${esc(T.description)}</summary><p class="description-modele">${esc(t.text)}</p></details><div class="actions-carte-modele"><button type="button" class="bouton" data-modele="${t.id}" aria-label="${esc(txt(T.chooseAria, { framework: t.name }))}">${esc(T.choose)}</button></div><p class="etat-chargement" data-ins-etat></p></li>`).join("")}</ul><p class="plus-modeles" data-variante><a href="${D.urlBibliotheque}">${esc(T.libraryLink)}</a></p>`;
  }
  function ligne(c, add) {
    const k = K[c], calc = k.t === "Calculated", visible = !etat.filtre || (c + " " + k.n).toLowerCase().includes(etat.filtre);
    return `<li class="ligne-coche"${visible ? "" : " hidden"}><input type="checkbox" id="ik-${c}" data-kpi="${c}"${etat.coches.has(c) ? " checked" : ""} aria-describedby="in-${c}"><span class="code-coche"><span class="id-chip">${c}</span></span>
      <div class="indicateur-coche"><label for="ik-${c}" class="nom-coche">${esc(k.n)}</label>${k.f ? `<div class="calcul-clair"><span aria-hidden="true">=</span> <span class="visually-hidden">${esc(T.calculation)}</span>${esc(k.f)}</div>` : ""}
      <div class="notes-coche" id="in-${c}"><span class="note-ajout"${add ? "" : " hidden"}>${add ? esc(txt(T.addedAnyway, { list: [...add].join(", ") })) : ""}</span></div>
      ${k.d ? `<details class="aide-repliable"><summary>${esc(T.definition)}</summary><p>${esc(k.d)}</p></details>` : ""}</div>
      <span class="type-coche"><span class="type${calc ? " calc" : ""}">${esc(T.types[k.t] || k.t)}</span></span><span class="unite-coche">${esc(k.u || "—")}</span><span class="etat-coche"><span class="puce-coche nouveau">${esc(T.new)}</span></span></li>`;
  }
  function ecran2() {
    const m = modele(), add = ajoutes(), total = tous().length;
    return `${tete(m.name, true)}<p class="intro-page">${esc(T.allSelected)}</p>
      <div class="outils-cocher"><p class="compteur-coches" aria-live="polite"><b>${etat.coches.size}</b> ${esc(txt(T.selected, { total }))}</p>
        <label class="recherche-cocher"><span class="visually-hidden">${esc(T.search)}</span><input type="search" placeholder="${esc(T.searchPlaceholder)}" value="${esc(etat.filtre)}" data-ins-filtre></label>
        <div class="liens-cocher"><button type="button" class="lien" data-ins-tout="1">${esc(T.selectAll)}</button><button type="button" class="lien" data-ins-tout="0">${esc(T.deselectAll)}</button></div></div>
      <div class="arbre-coche">${m.themes.map((th, i) => { const n = th.kpis.filter((c) => etat.coches.has(c)).length; const vis = th.kpis.some((c) => !etat.filtre || (c + " " + K[c].n).toLowerCase().includes(etat.filtre));
        return `<fieldset class="theme-coche"${vis ? "" : " hidden"}><legend><span class="nom-theme-coche">${esc(th.name)}</span><span class="compte-theme">${n} / ${th.kpis.length}</span></legend>
          <div class="corps-theme-coche">${i === 0 ? `<div class="entete-coche" aria-hidden="true"><span></span><span>ID</span><span>${esc(T.colIndicator)}</span><span>${esc(T.colType)}</span><span>${esc(T.colUnit)}</span><span>${esc(T.colState)}</span></div>` : ""}
          <ul class="liste-coche">${th.kpis.map((c) => ligne(c, add.get(c))).join("")}</ul></div></fieldset>`; }).join("")}</div>
      ${etat.filtre && !tous().some((c) => (c + " " + K[c].n).toLowerCase().includes(etat.filtre)) ? `<p class="discret">${esc(T.noResult)}</p>` : ""}
      <div class="barre-enregistrement"><button type="button" class="bouton" data-ins-continuer>${esc(T.continue)}</button><button type="button" class="bouton secondaire" data-ins-annuler>${esc(T.cancel)}</button><span class="etat-barre" data-ins-zero${etat.coches.size ? " hidden" : ""}>${esc(T.selectOne)}</span></div>`;
  }
  function ecran3() {
    const m = modele(), add = ajoutes(), installes = new Set([...etat.coches, ...add.keys()]);
    const themes = m.themes.filter((th) => th.kpis.some((c) => installes.has(c))).length;
    if (etat.fait) return `${tete(m.name, true)}<div class="encart encart-succes" role="status"><p><b>${esc(txt(T.done, { framework: etat.nom || m.name, n: installes.size }))}</b></p><p>${esc(T.trialNote)}</p></div>
      <div class="barre-enregistrement"><button type="button" class="bouton secondaire" data-ins-encore>${esc(T.again)}</button></div>`;
    return `${tete(m.name, true)}<div class="carte resume-installation"><h4>${esc(T.summary)}</h4><ul class="phrases-installation">
      <li>${esc(txt(T.sentenceInstalled, { n: installes.size, framework: etat.nom || m.name, themes }))}</li>
      ${add.size ? `<li>${esc(txt(T.sentenceAdded, { n: add.size }))} ${[...add].map(([c, par]) => `<span class="id-chip">${c}</span> <span class="discret">${esc(txt(T.usedBy, { list: [...par].join(", ") }))}</span>`).join(", ")}</li>` : ""}
      <li>${esc(T.sentenceLevels)}<span class="detail-niveaux">${esc(T.levelsChange)}</span></li></ul>
      <div class="champs-installation"><label class="champ"><span class="libelle">${esc(T.frameworkName)}</span><input type="text" value="${esc(etat.nom || m.name)}" data-ins-nom maxlength="150"></label>
      <label class="champ"><span class="libelle">${esc(T.frequency)}</span><select>${T.frequencies.map((f) => `<option>${esc(f)}</option>`).join("")}</select></label></div></div>
      <div class="barre-enregistrement"><button type="button" class="bouton" data-ins-installer>${esc(T.install)}</button><button type="button" class="bouton secondaire" data-ins-retour>${esc(T.back)}</button></div>`;
  }
  function afficher(focus) {
    racine.innerHTML = etat.ecran === 1 ? ecran1() : etat.ecran === 2 ? ecran2() : ecran3();
    const f = focus && racine.querySelector(focus); if (f) f.focus();
  }
  // Charge le détail d'un modèle (une seule fois) : état annoncé (aria-busy, zone « status »), la liste reste en place ;
  // en cas d'échec, un message et un lien vers la page des modèles, sans rien casser.
  let enCours = false;
  async function charger(id, b) {
    const nom = D.templates.find((t) => t.id === id).name, zone = b.closest(".carte-modele").querySelector("[data-ins-etat]");
    racine.querySelectorAll("[data-ins-etat]").forEach((z) => { z.textContent = ""; z.className = "etat-chargement"; });
    const dire = (m, echec) => { zone.className = "etat-chargement" + (echec ? " echec" : " charge"); zone.textContent = m; if (echec) { zone.append(" "); const a = document.createElement("a"); a.href = D.urlBibliotheque; a.textContent = T.libraryLink; zone.append(a); } };
    if (!details[id]) {
      if (enCours) return false;
      enCours = true; racine.setAttribute("aria-busy", "true"); b.setAttribute("aria-disabled", "true"); dire(txt(T.loading, { framework: nom }));
      try {
        const r = await fetch(D.urlDetail.replace("{id}", id), { credentials: "omit" });
        if (!r.ok) throw new Error(String(r.status));
        details[id] = await r.json();
      } catch (_) {
        enCours = false; racine.removeAttribute("aria-busy"); b.removeAttribute("aria-disabled"); dire(txt(T.loadFailed, { framework: nom }), true); return false;
      }
      enCours = false; racine.removeAttribute("aria-busy");
    }
    K = details[id].kpi; return true;
  }
  racine.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.modele) { if (b.getAttribute("aria-disabled") === "true") return; if (!(await charger(b.dataset.modele, b))) return; etat.modele = b.dataset.modele; etat.coches = new Set(tous()); etat.filtre = ""; etat.nom = ""; etat.ecran = 2; afficher(".titre-installation"); }
    else if (b.dataset.insTout) { etat.coches = b.dataset.insTout === "1" ? new Set(tous()) : new Set(); afficher(`[data-ins-tout="${b.dataset.insTout}"]`); }
    else if ("insContinuer" in b.dataset) { if (!etat.coches.size) { const z = racine.querySelector("[data-ins-zero]"); z.hidden = false; z.classList.add("erreur"); return; } etat.ecran = 3; afficher(".titre-installation"); }
    else if ("insAnnuler" in b.dataset) { etat.ecran = 1; afficher(`[data-modele="${etat.modele}"]`); }
    else if ("insRetour" in b.dataset) { etat.ecran = 2; afficher(".titre-installation"); }
    else if ("insInstaller" in b.dataset) { etat.fait = true; afficher(".encart"); }
    else if ("insEncore" in b.dataset) { etat = { ecran: 1, modele: null, coches: new Set(), filtre: "", fait: false, nom: "" }; afficher("[data-modele]"); }
  });
  racine.addEventListener("change", (e) => {
    const c = e.target.dataset.kpi; if (!c) return;
    e.target.checked ? etat.coches.add(c) : etat.coches.delete(c); afficher(`#ik-${c}`);
  });
  racine.addEventListener("input", (e) => {
    if ("insFiltre" in e.target.dataset) { etat.filtre = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; afficher("[data-ins-filtre]"); const i = racine.querySelector("[data-ins-filtre]"); i.setSelectionRange(pos, pos); }
    else if ("insNom" in e.target.dataset) etat.nom = e.target.value;
  });
  afficher();
}
