// L'essai dans le navigateur : une petite reproduction de l'outil, avec des données fictives.
// Rien n'est envoyé ni gardé : l'état vit dans cette page et disparaît quand on la recharge.
import { LIGNES, SITES, KPIS, SAISIS, N1, DEPART, SEUIL, somme, sommePartielle, ecart, nombre, ecartTexte, fleche, pourcent } from "../lib/demo.mjs";
import { icone } from "../lib/icons.mjs";

const racine = document.getElementById("sandbox");
if (racine) demarrer(racine);

function demarrer(racine) {
  const T = JSON.parse(document.getElementById("sandbox-textes").textContent);
  const lang = document.documentElement.lang || "en";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const txt = (s, o = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (k in o ? o[k] : ""));
  const ico = (n) => icone(n, "");
  const maintenant = () => new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang, { dateStyle: "short", timeStyle: "short" }).format(new Date());

  const jour = (n, heure) => `${new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang, { dateStyle: "short" }).format(new Date(Date.now() - n * 864e5))}, ${heure}`;

  let etat;
  function depart() {
    const cellules = {};
    for (const s of SITES) {
      cellules[s] = {};
      for (const k of SAISIS) {
        const d = DEPART[s][k];
        const qui = s === "lyon" ? T.people.contributor : T.people.other;
        const h = [];
        if (d.v != null) h.push({ t: jour(6, "10:12"), qui, texte: txt(T.history.entered, { value: `${nombre(d.v, lang)} ${T.kpis[k].unit}` }) });
        if (d.f) h.push({ t: jour(6, "10:14"), qui, texte: txt(T.history.evidence, { file: d.f[0] }) });
        if (d.s === "validated") h.push({ t: jour(5, "08:47"), qui, texte: T.history.validated });
        cellules[s][k] = { v: d.v, s: d.s, c: d.c ? T.seedComment : "", f: [...(d.f || [])], h: h.reverse() };
      }
    }
    etat = { role: "contributor", onglet: "entry", site: "lyon", ouvert: null, cellules, message: "", suivi: "elec", eclat: false };
  }

  // ---- calculs
  const cel = (s, k) => etat.cellules[s][k];
  // qui agit, et sur quels sites : le contributeur sur Lyon, le validateur sur la France, l'auditeur partout
  const moi = () => (etat.role === "validator" ? T.people.validator : T.people.contributor);
  const perimetre = () => (etat.role === "validator" ? LIGNES.find((l) => l.id === "fr").sites : SITES);
  const part = (s) => { const e = cel(s, "elec").v, r = cel(s, "ren").v; return e && r != null ? r / e : null; };
  function alertes(s, k, c = cel(s, k)) {
    const liste = [];
    const e = ecart(c.v, N1[s][k]);
    if (e != null && Math.abs(e) > SEUIL) liste.push({ type: "n1", e, justifiee: !!c.c.trim() });
    const el = cel(s, "elec").v, re = cel(s, "ren").v;
    if ((k === "ren" || k === "elec") && el != null && re != null && re > el) liste.push({ type: "regle", bloque: true });
    return liste;
  }
  function compte(sites) {
    let v = 0, d = 0, t = 0;
    for (const s of sites) for (const k of SAISIS) { const st = cel(s, k).s; st === "validated" ? v++ : st === "draft" ? d++ : t++; }
    return { v, d, t, total: v + d + t };
  }
  // Lit ce qui est tapé. L'unité tapée après le nombre est acceptée (« 412 300 kWh »). En anglais, « 412.300 » se lit 412,3 :
  // c'est sans doute 412 300 tapé « à l'européenne », donc on le signale au lieu de l'arrondir en silence.
  // En français : la virgule sépare les décimales, l'espace les milliers ; le point est accepté comme une virgule
  // (1250.5), sauf « 412.300 », signalé de la même façon (412,3 ou 412 300 ?).
  function lire(texte, unite = "") {
    let s = texte.trim();
    if (unite && s.toLowerCase().endsWith(unite.toLowerCase())) s = s.slice(0, -unite.length);
    s = s.replace(/[\s\u00A0\u202F]/g, "");
    if (s === "") return { vide: true };
    const virgule = /^fr/.test(lang), europeen = /^es/.test(lang);
    if (!europeen && /^\d{1,3}(\.\d{3})+$/.test(s)) return { ambigu: true, lu: Math.round(Number(s)), devine: Number(s.replace(/\./g, "")) };
    s = virgule ? s.replace(",", ".") : europeen ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? { n } : { erreur: true };
  }
  const messageAmbigu = (r) => txt(T.msg.readAs, { read: nombre(r.lu, lang), guess: nombre(r.devine, lang), digits: String(r.devine) });

  function totalGroupe(k) {
    let v, n1, texte, n1Texte, st, saisis;
    if (k === "share") {
      const e = somme(SITES.map((s) => cel(s, "elec").v)), r = somme(SITES.map((s) => cel(s, "ren").v));
      v = e && r != null ? r / e : null; n1 = sommePartielle(SITES.map((s) => N1[s].ren)) / sommePartielle(SITES.map((s) => N1[s].elec));
      texte = v == null ? "–" : pourcent(v, lang); n1Texte = pourcent(n1, lang);
      saisis = SITES.filter((s) => cel(s, "elec").v != null && cel(s, "ren").v != null).length;
      st = v == null ? "incomplete" : SITES.some((s) => cel(s, "elec").s === "draft" || cel(s, "ren").s === "draft") ? "provisional" : "calculated";
    } else {
      const vals = SITES.map((s) => cel(s, k).v); v = somme(vals); n1 = sommePartielle(SITES.map((s) => N1[s][k]));
      texte = `${nombre(v == null ? sommePartielle(vals) : v, lang)} <span class="unite">${esc(T.kpis[k].unit)}</span>`; n1Texte = nombre(n1, lang);
      saisis = vals.filter((x) => x != null).length;
      st = v == null ? "incomplete" : SITES.some((s) => cel(s, k).s === "draft") ? "provisional" : "calculated";
    }
    const cls = { incomplete: "statut-incomplet", provisional: "statut-brouillon", calculated: "statut-calcule" }[st];
    const lib = st === "incomplete" ? `${T.status.incomplete} · ${txt(T.dash.sitesOf, { n: saisis, total: SITES.length })}` : st === "provisional" ? T.dash.provisional : T.status.calculated;
    return { v, n1, texte, n1Texte, st, chip: `<span class="statut ${cls}">${esc(lib)}</span>` };
  }

  // ---- morceaux d'affichage
  const statut = (s) => `<span class="statut ${{ validated: "statut-valide", draft: "statut-brouillon", todo: "" }[s]}">${esc(T.status[s])}</span>`;
  const niveau = (id) => { const l = LIGNES.find((x) => x.id === id); return `<span class="niveau niveau-${l.niveau}">${esc(T.levels[{ groupe: "group", pays: "country", site: "site" }[l.niveau]])}</span>`; };
  const nomOrg = (id) => (id === "group" ? T.group : T.orgs[id]);
  const ecartHtml = (e) => e == null ? `<span class="discret">–</span>` : `<span class="ecart${Math.abs(e) > SEUIL ? " fort" : ""}"><span class="ecart-fleche" aria-hidden="true">${fleche(e)}</span>${ecartTexte(e, lang)}</span>`;
  const barre = (c) => `<div class="progression" role="img" aria-label="${esc(txt(T.dash.draftsOf, { n: c.v, d: c.d, total: c.total }))}"><span class="v" style="width:${(100 * c.v) / c.total}%"></span><span class="d" style="width:${(100 * c.d) / c.total}%"></span></div>`;

  function entete() {
    const onglet = (id, ic) => `<button type="button" role="tab" id="sb-tab-${id}" aria-selected="${etat.onglet === id}" aria-controls="sb-vue" tabindex="${etat.onglet === id ? 0 : -1}" data-onglet="${id}">${ico(ic)}${esc(T.tabs[id])}</button>`;
    return `<div class="bandeau"><div class="marque"><span class="logo" aria-hidden="true">HG</span><span><b>${esc(T.productName)}</b><span>${esc(T.group)} · ${esc(T.demoTag)}</span></span></div>
      <div class="onglets" role="tablist" aria-label="${esc(T.tabsLabel)}">${onglet("entry", "pencil")}${onglet("dashboard", "dashboard")}${onglet("consistency", "alert")}</div></div>`;
  }
  function outils(titre) {
    return `<div class="barre-outils"><h3>${esc(titre)} <span class="statut-campagne">${ico("pencil")}${esc(T.campaignStatus)}</span></h3>
      <div class="droite"><button type="button" class="lien" data-reset>${esc(T.reset)}</button></div></div>`;
  }
  const lecture = () => etat.role === "auditor" ? `<p class="info-lecture">${ico("eye")}<span>${esc(T.banner.auditor)}</span></p>` : "";

  function vueSaisie() {
    const s = etat.site, c = compte([s]);
    const fini = c.v === c.total;
    const phrase = fini ? txt(T.banner.done, { n: c.v, total: c.total })
      : txt(T.banner.progress, { org: `<b>${esc(nomOrg(s))}</b>`, todo: `<b>${c.t}</b>`, drafts: `<b>${c.d}</b>` });
    const choixSite = etat.role !== "contributor"
      ? `<label class="titre" style="margin:0 0 12px">${esc(T.cols.organisation)} <select data-site>${perimetre().map((x) => `<option value="${x}"${x === s ? " selected" : ""}>${esc(T.orgs[x])}</option>`).join("")}</select></label>` : "";
    const lignes = SAISIS.map((k) => {
      const x = cel(s, k), al = alertes(s, k), e = ecart(x.v, N1[s][k]);
      const aV = al.some((a) => a.bloque || !a.justifiee);
      const badge = aV ? `<span class="badge-verifier">${ico("alert")}${esc(T.panel.toCheck)}</span>` : "";
      const val = x.v == null ? `<span class="saisir">${esc(etat.role === "auditor" ? "–" : T.panel.enter)}</span>` : `${nombre(x.v, lang)} <span class="unite">${esc(T.kpis[k].unit)}</span>`;
      const clip = x.f.length ? `<span class="trombone">${ico("clip")}<span class="nombre">${x.f.length}</span><span class="sr"> ${esc(T.cols.evidence)}</span></span>` : KPIS[k].preuve ? `<span class="discret">${esc(T.panel.evidenceRequired)}</span>` : `<span class="discret">–</span>`;
      return `<tr class="ligne${etat.ouvert === k ? " ouverte" : ""}">
        <th scope="row"><button type="button" class="nom-bouton" data-ouvrir="${k}" aria-expanded="${etat.ouvert === k}" aria-controls="sb-panneau">${esc(T.kpis[k].name)}</button>${badge}<span class="sous">${statut(x.s)}${x.f.length ? clip : ""}</span></th>
        <td class="valeur nombre">${val}</td><td class="n1 nombre mq">${nombre(N1[s][k], lang)}</td><td class="nombre mq">${ecartHtml(e)}</td><td class="mq">${statut(x.s)}</td><td class="mq">${clip}</td></tr>`;
    }).join("");
    const p = part(s), pn = N1[s].ren / N1[s].elec;
    const prov = cel(s, "elec").s === "draft" || cel(s, "ren").s === "draft";
    const statutPart = `<span class="statut ${p == null ? "statut-incomplet" : prov ? "statut-brouillon" : "statut-calcule"}">${esc(p == null ? T.status.incomplete : prov ? T.dash.provisional : T.status.calculated)}</span>`;
    const g = totalGroupe(etat.suivi);
    const ligneGroupe = `<p class="ligne-groupe${etat.eclat ? " eclat" : ""}"><span class="niveau niveau-groupe">${esc(T.levels.group)}</span><span><b>${esc(etat.role === "auditor" ? T.cols.total : T.dash.yourValue)}</b> · ${esc(T.kpis[etat.suivi].name)}</span><b class="nombre total">${g.texte}</b>${g.chip}</p>`;
    const prochain = SAISIS.find((k) => cel(s, k).s !== "validated");
    const calc = `<tr><th scope="row">${esc(T.kpis.share.name)} <span class="type calc">${esc(T.types.calculated)}</span></th><td class="valeur nombre">${p == null ? "–" : pourcent(p, lang)}</td><td class="n1 nombre mq">${pourcent(pn, lang)}</td><td class="mq"></td><td class="mq">${statutPart}</td><td class="mq"></td></tr>`;
    return `${outils(`${T.tabs.entry} – ${T.campaign}`)}${lecture()}${choixSite}
      <div class="carte resume${fini ? " fini" : ""}"><p class="phrase"><span>${phrase}</span>${!fini && etat.role !== "auditor" ? `<button type="button" class="b" data-continuer>${esc(cel(s, prochain).s === "draft" ? T.banner.continueDraft : T.banner.continue)}</button>` : ""}</p>
        ${barre(c)}<p class="compteurs"><span><i class="point v"></i><b>${c.v}</b> ${esc(T.status.validated)}</span><span><i class="point d"></i><b>${c.d}</b> ${esc(T.status.draft)}</span><span><i class="point t"></i><b>${c.t}</b> ${esc(T.status.todo)}</span><span class="pct nombre">${esc(txt(T.banner.validatedPct, { pct: Math.round((100 * c.v) / c.total) }))}</span></p>${ligneGroupe}</div>
      <div class="defile"><table><thead><tr><th scope="col">${esc(T.cols.indicator)}</th><th scope="col">${esc(T.cols.value)} <span class="annee-courante">2026</span></th><th scope="col" class="n1 mq">${esc(T.cols.n1)} <span class="n1-libelle">2025</span></th><th scope="col" class="mq">${esc(T.cols.variance)}</th><th scope="col" class="mq">${esc(T.cols.status)}</th><th scope="col" class="mq">${esc(T.cols.evidence)}</th></tr></thead><tbody>${lignes}${calc}</tbody></table></div>`;
  }

  function constats(s, k) {
    const x = cel(s, k), u = T.kpis[k].unit;
    return alertes(s, k).map((a) => a.type === "regle"
      ? { ...a, titre: T.cons.rule, texte: T.msg.renRule }
      : { ...a, titre: T.cons.varianceN1, texte: txt(T.cons.finding, { value: `${nombre(x.v, lang)} ${u}`, n1: `${nombre(N1[s][k], lang)} ${u}`, pct: ecartTexte(a.e, lang) }) });
  }

  function panneau() {
    const s = etat.site, k = etat.ouvert, x = cel(s, k), lu = etat.role === "auditor", valide = x.s === "validated";
    const fige = lu || valide;
    const e = ecart(x.v, N1[s][k]);
    const al = constats(s, k).map((a) => `<div class="a-verifier${a.bloque ? " bloque" : ""}"><b>${ico("alert")}${esc(a.titre)} · ${esc(a.bloque ? T.panel.blocks : a.justifiee ? T.status.justified : T.status.toHandle)}</b>${esc(a.texte)}</div>`).join("");
    const preuves = x.f.length ? `<ul class="preuves">${x.f.map((n, i) => `<li>${ico("file")}<span>${esc(n)}</span>${fige ? "" : `<button type="button" class="icone" data-retirer="${i}" aria-label="${esc(txt(T.panel.remove, { file: n }))}">${ico("trash")}</button>`}</li>`).join("")}</ul>` : `<p class="discret" style="margin-top:8px">${esc(T.panel.noEvidence)}</p>`;
    const manque = KPIS[k].preuve && !x.f.length;
    const exemple = `<button type="button" class="b secondaire compact" data-exemple>${esc(T.panel.sample)}</button>`;
    const depot = fige ? "" : `<label class="zone-depot"><input type="file" accept=".pdf,.jpg,.jpeg,.png" data-fichier aria-describedby="sb-formats"><strong>${esc(T.panel.choose)}</strong></label><p class="aide-champ" id="sb-formats">${esc(T.panel.formats)} ${esc(T.panel.stays)}</p>${manque ? "" : `<p style="margin-top:8px">${exemple}</p>`}`;
    const alerte = `<p class="a-verifier bloque" id="sb-erreur" data-erreur role="alert" hidden></p>`;
    const actions = lu ? "" : valide
      ? (etat.role === "validator"
        ? `<div class="actions"><button type="button" class="b secondaire" data-rouvrir aria-describedby="sb-aide-rouvrir">${esc(T.panel.reopen)}</button></div><p class="aide-valider" id="sb-aide-rouvrir">${esc(T.panel.reopenHelp)}</p>`
        : `<p class="aide-champ" style="margin-top:10px">${esc(T.panel.validatedNote)}</p>`)
      : `${manque ? `<p class="aide-preuve">${ico("clip")}<span>${esc(T.panel.needEvidenceHint)}</span>${exemple}</p>` : ""}<div data-emplacement="actions">${alerte}</div><div class="actions"><button type="button" class="b secondaire" data-enregistrer>${esc(T.panel.save)}</button><button type="button" class="b" data-valider aria-describedby="sb-aide-valider">${esc(T.panel.validate)}</button></div><p class="aide-valider" id="sb-aide-valider">${esc(T.panel.validateHelp)}</p>`;
    return `<section class="panneau" id="sb-panneau" role="region" aria-labelledby="sb-titre">
      <div class="panneau-haut"><span class="statut-panneau">${statut(x.s)}</span><button type="button" class="icone" data-fermer aria-label="${esc(T.panel.close)}">${ico("x")}</button></div>
      <h3 class="titre-cellule" id="sb-titre">${esc(T.kpis[k].name)}</h3>
      <div class="puces-cellule"><span class="id-chip">${KPIS[k].code}</span>${niveau(s)}<span>${esc(nomOrg(s))}</span><span class="discret">${esc(T.kpis[k].theme)}</span></div>
      <div class="carte-saisie">
        <div data-constats>${al}</div>
        <div class="saisie-duo"><div><label class="titre" for="sb-valeur">${esc(T.panel.value)} <span class="annee-courante">2026</span></label>
          <span class="champ-valeur"><input type="text" id="sb-valeur" inputmode="decimal" autocomplete="off" value="${x.v == null ? "" : nombre(x.v, lang)}"${fige ? " readonly" : ""} aria-describedby="sb-format"><span class="u">${esc(T.kpis[k].unit)}</span></span>
          ${fige ? `<span id="sb-format"></span>` : `<p class="aide-champ" id="sb-format" data-format>${esc(T.panel.format)}</p>`}<div data-emplacement="valeur"></div></div>
          <div class="saisie-n1"><span class="n1-libelle">N-1 · 2025</span><strong>${nombre(N1[s][k], lang)} <span class="unite">${esc(T.kpis[k].unit)}</span></strong><span class="ecart-direct" data-ecart>${e == null ? "" : ecartHtml(e)}</span></div></div>
        <label class="titre" for="sb-commentaire">${esc(T.panel.comment)}</label>
        <textarea id="sb-commentaire" rows="2" placeholder="${esc(T.panel.commentPlaceholder)}"${fige ? " readonly" : ""} aria-describedby="sb-regle-commentaire">${esc(x.c)}</textarea>
        <span class="aide-champ" id="sb-regle-commentaire">${esc(T.panel.commentRule)}</span>
        ${actions}
      </div>
      <div class="carte-saisie"><span class="titre">${esc(T.panel.evidence)}${KPIS[k].preuve ? ` <span class="etiquette e-neutre">${esc(T.panel.evidenceRequired)}</span>` : ""}</span>${depot}${preuves}</div>
      <div class="carte-saisie"><span class="titre">${esc(T.panel.history)}</span>${x.h.length ? `<ul class="histo">${x.h.map((h) => `<li><span>${esc(h.texte)}<small>${esc(h.t)} · ${esc(h.qui)}</small></span></li>`).join("")}</ul>` : `<p class="discret">–</p>`}</div>
    </section>`;
  }

  function vueTableau() {
    const lignes = LIGNES.map((l) => { const c = compte(l.sites); return `<tr class="r${l.rang}"><th scope="row"><span class="org">${niveau(l.id)}${esc(nomOrg(l.id))}</span></th><td>${barre(c)}</td><td class="nombre droite mq">${c.v} / ${c.total}</td><td class="nombre droite taux">${pourcent(c.v / c.total, lang)}</td></tr>`; }).join("");
    const conso = [...SAISIS, "share"].map((k) => {
      const g = totalGroupe(k);
      return `<tr><th scope="row">${esc(T.kpis[k].name)}</th><td class="valeur nombre droite">${g.texte}</td><td class="n1 nombre droite mq">${g.n1Texte}</td><td class="nombre mq">${k === "share" || g.v == null ? `<span class="discret">–</span>` : ecartHtml(ecart(g.v, g.n1))}</td><td>${g.chip}</td></tr>`;
    }).join("");
    return `${outils(`${T.tabs.dashboard} – ${T.campaign}`)}${lecture()}${etat.role === "contributor" ? `<p class="info-lecture">${ico("info")}<span>${esc(T.dash.scopeNote)}</span></p>` : ""}
      <div class="carte"><h3>${esc(T.dash.title)}</h3><p class="compteurs" style="margin:6px 0 12px"><span><i class="point v"></i>${esc(T.dash.legendValidated)}</span><span><i class="point d"></i>${esc(T.dash.legendDraft)}</span><span><i class="point t"></i>${esc(T.dash.legendTodo)}</span></p>
        <div class="defile"><table class="arbre fixe"><thead><tr><th scope="col">${esc(T.cols.organisation)}</th><th scope="col" class="col-prog">${esc(T.cols.progress)}</th><th scope="col" class="droite mq">${esc(T.status.validated)}</th><th scope="col" class="droite">${esc(T.cols.rate)}</th></tr></thead><tbody>${lignes}</tbody></table></div></div>
      <div class="carte"><h3>${esc(T.dash.consolidation)} · ${esc(T.group)}</h3><p class="discret" style="margin:4px 0 12px">${esc(T.dash.provisionalHelp)} ${esc(T.dash.incompleteHelp)}</p>
        <div class="defile"><table class="fixe conso"><thead><tr><th scope="col">${esc(T.cols.indicator)}</th><th scope="col" class="droite">${esc(T.cols.total)} <span class="annee-courante">2026</span></th><th scope="col" class="n1 droite mq">${esc(T.cols.n1)} <span class="n1-libelle">2025</span></th><th scope="col" class="mq">${esc(T.cols.variance)}</th><th scope="col">${esc(T.cols.status)}</th></tr></thead><tbody>${conso}</tbody></table></div></div>`;
  }

  function vueCoherence() {
    const lignes = [];
    for (const s of SITES) for (const k of SAISIS) for (const a of constats(s, k)) {
      if (a.type === "regle" && k === "elec") continue; // la règle entre deux KPI est portée par le KPI « renouvelable »
      const st = a.bloque ? ["e-orange", T.status.toHandle] : a.justifiee ? ["e-jaune", T.status.justified] : ["e-orange", T.status.toHandle];
      lignes.push(`<tr><td class="mq">${ico("alert").replace("<svg", '<svg class="icone-alerte"')}</td><td class="mq"><span class="etiquette e-orange">${esc(a.titre)}</span></td><th scope="row">${esc(T.kpis[k].name)}<span class="constat" style="margin-top:4px">${niveau(s)} ${esc(nomOrg(s))}</span><span class="sous"><span class="etiquette e-orange">${esc(a.titre)}</span><span class="etiquette ${st[0]}">${esc(st[1])}</span></span></th><td>${esc(a.texte)}${a.justifiee && cel(s, k).c ? `<span class="constat discret">${esc(T.quoteOpen)}${esc(cel(s, k).c)}${esc(T.quoteClose)}</span>` : ""}</td><td class="mq"><span class="etiquette ${st[0]}">${esc(st[1])}</span></td></tr>`);
    }
    return `${outils(`${T.cons.title} – ${T.campaign}`)}${lecture()}<p style="margin-bottom:12px">${esc(T.cons.lead)}</p>
      ${lignes.length ? `<div class="defile"><table><thead><tr><th scope="col" class="mq"><span class="sr">${esc(T.panel.toCheck)}</span></th><th scope="col" class="mq">${esc(T.cols.check)}</th><th scope="col">KPI · ${esc(T.cols.organisation)}</th><th scope="col">${esc(T.cols.finding)}</th><th scope="col" class="mq">${esc(T.cols.status)}</th></tr></thead><tbody>${lignes.join("")}</tbody></table></div>` : `<p class="carte discret">${esc(T.cons.none)}</p>`}`;
  }

  // ---- affichage
  function afficher(focus) {
    const vue = etat.onglet === "entry" ? vueSaisie() : etat.onglet === "dashboard" ? vueTableau() : vueCoherence();
    racine.innerHTML = `${entete()}<div class="scene${etat.ouvert ? " ouverte" : ""}"><div class="pad" id="sb-vue" role="tabpanel" aria-labelledby="sb-tab-${etat.onglet}">${vue}</div>${etat.ouvert && etat.onglet === "entry" ? panneau() : ""}</div>`;
    racine.dataset.pret = "1";
    majRoles();
    if (focus) racine.querySelector(focus)?.focus();
  }
  function dire(m) { etat.message = m; annonce.textContent = ""; requestAnimationFrame(() => (annonce.textContent = m)); clearTimeout(dire.t); dire.t = setTimeout(() => (annonce.textContent = ""), 6000); }
  const annonce = document.getElementById("sandbox-annonce");

  // Une seule alerte (role=alert), posée près du champ en cause et liée à lui par aria-describedby : lue une fois.
  function erreur(m, champ = "#sb-valeur") {
    const p = racine.querySelector("[data-erreur]"), i = racine.querySelector(champ);
    racine.querySelector(`[data-emplacement="${champ === "#sb-valeur" ? "valeur" : "actions"}"]`)?.appendChild(p);
    p.hidden = false; p.textContent = m;
    if (champ === "[data-fichier]") racine.querySelectorAll(".aide-preuve > span, .aide-preuve > svg").forEach((e) => (e.hidden = true)); // le message d'erreur dit déjà la même chose
    if (i) {
      if (champ !== "[data-fichier]") i.setAttribute("aria-invalid", "true");
      i.setAttribute("aria-describedby", `${i.getAttribute("aria-describedby") || ""} sb-erreur`.trim());
      i.focus();
    }
  }
  function effacerErreur(i) {
    i.removeAttribute("aria-invalid");
    i.setAttribute("aria-describedby", (i.getAttribute("aria-describedby") || "").replace(/\s*sb-erreur/, ""));
    const p = racine.querySelector("[data-erreur]"); if (p) p.hidden = true;
  }
  // Prend ce qui est tapé. silencieux : enregistrement automatique du brouillon à la fermeture (rien si la saisie n'est pas lisible).
  function prendreSaisie(silencieux = false) {
    const s = etat.site, k = etat.ouvert, x = cel(s, k), champ = racine.querySelector("#sb-valeur");
    if (!champ || champ.readOnly) return null;
    const r = lire(champ.value, T.kpis[k].unit);
    if (r.erreur || r.ambigu) { if (!silencieux) erreur(r.ambigu ? messageAmbigu(r) : T.msg.notNumber); return null; }
    const v = r.vide ? null : r.n, c = racine.querySelector("#sb-commentaire").value;
    const qui = moi();
    if (v !== x.v && v != null) x.h.unshift({ t: maintenant(), qui, texte: txt(T.history.entered, { value: `${nombre(v, lang)} ${T.kpis[k].unit}` }) });
    if (c !== x.c) x.h.unshift({ t: maintenant(), qui, texte: T.history.comment });
    if (v !== x.v || c !== x.c) { x.v = v; x.c = c; x.s = v == null ? "todo" : "draft"; }
    return x;
  }

  racine.addEventListener("click", (ev) => {
    const c = (sel) => ev.target.closest(sel);
    let b;
    if ((b = c("[data-onglet]"))) { if (etat.ouvert) prendreSaisie(true); etat.onglet = b.dataset.onglet; etat.ouvert = null; afficher(`#sb-tab-${etat.onglet}`); }
    else if ((b = c("[data-ouvrir]") || c("tr.ligne")?.querySelector("[data-ouvrir]"))) { if (etat.ouvert) prendreSaisie(true); etat.ouvert = b.dataset.ouvrir; etat.suivi = etat.ouvert; afficher(etat.role === "auditor" || cel(etat.site, etat.ouvert).s === "validated" ? ".panneau [data-fermer]" : "#sb-valeur"); }
    else if (c("[data-continuer]")) { etat.ouvert = SAISIS.find((k) => cel(etat.site, k).s !== "validated"); etat.suivi = etat.ouvert; afficher("#sb-valeur"); }
    else if (c("[data-fermer]")) fermer();
    else if (c("[data-reset]")) { depart(); afficher("[data-reset]"); dire(T.msg.reset); }
    else if (c("[data-rouvrir]")) { const x = cel(etat.site, etat.ouvert); x.s = "draft"; x.h.unshift({ t: maintenant(), qui: moi(), texte: T.history.reopened }); afficher("#sb-valeur"); dire(T.msg.reopened); }
    else if (c("[data-enregistrer]")) { if (prendreSaisie()) { afficher("#sb-valeur"); dire(T.msg.draftSaved); } }
    else if (c("[data-valider]")) valider();
    else if (c("[data-exemple]")) ajouterPreuve(T.panel.sampleName);
    else if ((b = c("[data-retirer]"))) { const x = cel(etat.site, etat.ouvert); const [n] = x.f.splice(+b.dataset.retirer, 1); x.h.unshift({ t: maintenant(), qui: moi(), texte: txt(T.history.evidenceRemoved, { file: n }) }); garderSaisie(() => afficher("[data-fichier]")); dire(T.msg.evidenceRemoved); }
  });
  // garde ce qui est tapé (valeur, commentaire) quand le panneau est redessiné sans enregistrer
  function garderSaisie(f) { const v = racine.querySelector("#sb-valeur")?.value, c = racine.querySelector("#sb-commentaire")?.value; f(); const i = racine.querySelector("#sb-valeur"), t = racine.querySelector("#sb-commentaire"); if (i && v != null && !i.readOnly) { i.value = v; t.value = c; majEcart(); } }
  function ajouterPreuve(nom) {
    const x = cel(etat.site, etat.ouvert); x.f.push(nom);
    x.h.unshift({ t: maintenant(), qui: moi(), texte: txt(T.history.evidence, { file: nom }) });
    garderSaisie(() => afficher("[data-valider]")); dire(T.msg.evidenceAdded);
  }
  function fermer() { const k = etat.ouvert; prendreSaisie(true); etat.ouvert = null; afficher(`[data-ouvrir="${k}"]`); }
  function valider() {
    const s = etat.site, k = etat.ouvert;
    const x = prendreSaisie(); if (!x) return;
    const refuser = (m, champ) => { afficher(); erreur(m, champ); };
    if (x.v == null) return refuser(T.msg.notNumber);
    if (alertes(s, k).some((a) => a.bloque)) return refuser(T.msg.blocked);
    if (KPIS[k].preuve && !x.f.length) return refuser(T.msg.needEvidence, "[data-fichier]");
    if (alertes(s, k).some((a) => a.type === "n1" && !a.justifiee)) return refuser(T.msg.needComment, "#sb-commentaire");
    x.s = "validated"; x.h.unshift({ t: maintenant(), qui: moi(), texte: T.history.validated, valide: true });
    etat.ouvert = null; etat.suivi = k; etat.eclat = true; afficher(`[data-ouvrir="${k}"]`); etat.eclat = false;
    dire(txt(T.msg.validatedTotal, { total: racine.querySelector(".ligne-groupe .total")?.textContent.replace(/\s+/g, " ").trim() || "" }));
  }
  // Pendant la frappe : l'écart avec N-1 et, sous le champ, comment la valeur est lue (rien n'est annoncé à chaque touche).
  function majEcart() {
    const i = racine.querySelector("#sb-valeur"); if (!i) return;
    const k = etat.ouvert, r = lire(i.value, T.kpis[k].unit), z = racine.querySelector("[data-ecart]"), f = racine.querySelector("[data-format]");
    effacerErreur(i);
    z.innerHTML = r.n == null ? "" : ecartHtml(ecart(r.n, N1[etat.site][k]));
    if (f) { f.textContent = r.ambigu ? messageAmbigu(r) : T.panel.format; f.classList.toggle("attention", !!r.ambigu); }
  }
  racine.addEventListener("input", (ev) => { if (ev.target.id === "sb-valeur") majEcart(); else if (ev.target.id === "sb-commentaire") effacerErreur(ev.target); });
  racine.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.matches("[data-site]")) { etat.site = t.value; afficher("[data-site]"); }
    else if (t.matches("[data-fichier]")) {
      const f = t.files[0]; if (!f) return;
      if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return erreur(T.msg.badFile, "[data-fichier]");
      if (f.size > 5 * 1024 * 1024) return erreur(T.msg.bigFile, "[data-fichier]");
      ajouterPreuve(f.name); // le fichier n'est ni lu ni envoyé : seul son nom est affiché
    }
  });
  racine.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && etat.ouvert) { ev.preventDefault(); fermer(); return; }
    const o = ev.target.closest?.("[role=tab]");
    if (o && (ev.key === "ArrowRight" || ev.key === "ArrowLeft")) {
      const tous = [...racine.querySelectorAll("[role=tab]")]; const n = tous[(tous.indexOf(o) + (ev.key === "ArrowRight" ? 1 : tous.length - 1)) % tous.length]; n.click();
    }
  });

  // ---- choix du rôle (au-dessus de l'outil) : contributeur, validateur, auditeur
  const roles = document.querySelector("[data-roles]");
  function majRoles() {
    if (!roles) return;
    roles.querySelectorAll("[data-role]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.role === etat.role)));
    const p = roles.querySelector("[data-role-texte]"), texte = T.role[`${etat.role}Text`];
    if (p.textContent !== texte) p.textContent = texte;
  }
  if (roles) {
    roles.hidden = false;
    roles.addEventListener("click", (ev) => { const b = ev.target.closest("[data-role]"); if (!b || b.dataset.role === etat.role) return; etat.role = b.dataset.role; etat.site = "lyon"; etat.ouvert = null; afficher(); });
  }

  depart();
  afficher();
}
