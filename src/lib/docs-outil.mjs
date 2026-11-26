// Ce que le site reprend de la documentation de l'outil pour l'équipe informatique, et ce qu'il en coupe. Une seule
// définition pour la page /docs/ (scripts/sync-tool.mjs) et pour le manuel PDF de l'IT (qa/guide-pdfs.mjs).
//
// Le site ne présente ni l'assistant IA facultatif (clé du client, jamais essayé avec un vrai fournisseur) ni la
// relecture des traductions : leurs sections, les lignes de tableau qui les citent et les morceaux de phrase qui les
// nomment ne sont pas repris. Les serveurs MCP des assistants restent : le site les présente.
// Un remplacement qui ne trouve plus son texte dans l'outil est signalé par la synchronisation (texte changé dans
// l'outil : la règle est à revoir), et RESTES_IA arrête la synchronisation si une mention reste.

// Les quatre documents pour l'IT ajoutés à la version 1.1.0 de l'outil : une partie de la page /docs/ chacun, comme
// l'hébergement géré. « slug » est l'ancre de la partie (et son ancienne adresse /docs/<slug>/), le même dans toutes
// les langues ; « ordre » la range dans le menu, entre les parties du guide d'installation (1 à 11, l'hébergement géré
// à 2,5) ; « groupe » est une clé de docsUi.groups (src/content/<langue>/_site.json).
const AUTRES = [
  { slug: "it-request", ordre: 0.3, groupe: "Before you install" },
  { slug: "security-overview", ordre: 0.6, groupe: "Before you install" },
  { slug: "from-pc-to-server", ordre: 3.5, groupe: "Get started" },
  { slug: "single-sign-on", ordre: 4.5, groupe: "Run" },
];

export const DOCS_OUTIL = {
  en: {
    installation: "docs/installation.md", gere: "docs/managed_hosting.md", titreGere: "Managed hosting",
    autres: {
      "it-request": { fichier: "docs/it_request.md", titre: "What to prepare" },
      "security-overview": {
        fichier: "docs/security_overview.md", titre: "Security overview",
        // écrite pour le site : la copie laisse de côté l'assistant IA facultatif, et le dit (revue de sécurité)
        note: "> This copy leaves out one optional feature, off by default, that this site does not present. The complete document is `docs/security_overview.md` in the repository of the tool.",
      },
      "from-pc-to-server": { fichier: "docs/from_pc_to_server.md", titre: "From the all-in-one version to a server" },
      "single-sign-on": { fichier: "docs/single_sign_on.md", titre: "Sign in with a company account" },
    },
    ecartees: [/^##+ AI assistant \(optional\)$/, /^##+ Have the translated texts proofread$/],
    lignes: [/`AI_SOCKET`/, /api\.anthropic\.com/, /AI assistant \(optional\)/, /^\| Tool to the AI provider \|/, /^\| Calls to the AI assistant \|/, /^\| Key of the AI assistant \|/],
    remplacements: [
      // [texte de l'outil, texte du site, largeur gardée (schéma en texte : le cadre reste aligné)]
      ["secret key, AI keys, sign-in counters", "secret key, sign-in counters", true],
      [", api.anthropic.com (if the AI assistant is on)", ""],
      [", keys of the AI assistant, and sign-in counters", ", and sign-in counters"],
      ["It turns off the automatic reminders, the AI assistant, and the assistants (MCP) of the space", "It turns off the automatic reminders and the assistants (MCP) of the space"],
      ["The automatic reminders, the AI assistant, and the assistants (MCP) of the space are off", "The automatic reminders and the assistants (MCP) of the space are off"],
      [" With the AI assistant off, the tool opens no connection to the AI provider.", ""],
      ["Secret key, keys of the AI assistant, `.env` file", "Secret key, `.env` file"],
      ["the MCP tokens, the keys of the AI assistant, the secret key", "the MCP tokens, the secret key"],
      ["trash, AI assistant, MCP server", "trash, MCP server"],
      [", your identity provider if company sign-in is on, and the AI provider if an administrator turns the AI assistant on.", ", and your identity provider if company sign-in is on."],
      ["(STARTTLS and SSL), the AI assistant, and every", "(STARTTLS and SSL), and every"],
      ["Outgoing HTTPS of the tool (AI assistant, and the other HTTPS connections)", "Outgoing HTTPS connections of the tool"],
    ],
    // renvoi vers la version de l'autre langue : le site a son propre menu des langues
    autreLangue: /\s*French\s+version:\s+\[[^\]]+\]\([^)]+\)\.?/g,
  },
  fr: {
    installation: "docs/fr/installation.md", gere: "docs/fr/hebergement_cle_en_main.md", titreGere: "Hébergement clé en main",
    autres: {
      "it-request": { fichier: "docs/fr/demande_it.md", titre: "Ce qu'il faut préparer" },
      "security-overview": {
        fichier: "docs/fr/dossier_securite.md", titre: "Dossier de sécurité",
        note: "> Cette copie laisse de côté une fonction facultative, éteinte par défaut, que ce site ne présente pas. Le document complet est `docs/fr/dossier_securite.md` dans le dépôt de l'outil.",
      },
      "from-pc-to-server": { fichier: "docs/fr/du_pc_au_serveur.md", titre: "De la version tout-en-un à un serveur" },
      "single-sign-on": { fichier: "docs/fr/connexion_entreprise.md", titre: "Se connecter avec le compte d'entreprise" },
    },
    ecartees: [/^##+ Assistant IA \(facultatif\)$/, /^##+ Faire relire les textes traduits$/],
    lignes: [/`AI_SOCKET`/, /api\.anthropic\.com/, /Assistant IA \(facultatif\)/, /^> Version française du guide anglais/, /^\| De l'outil vers le fournisseur d'IA \|/, /^\| Appels à l'assistant IA \|/, /^\| Clé de l'assistant IA \|/],
    remplacements: [
      ["clé secrète, clés de l'assistant IA, compteurs des connexions", "clé secrète, compteurs des connexions", true],
      [", api.anthropic.com (si l'assistant IA est allumé)", ""],
      [", clés de l'assistant IA et compteurs des connexions", " et compteurs des connexions"],
      ["Il éteint les\n  relances automatiques, l'assistant IA et les assistants (MCP) de l'espace", "Il éteint les\n  relances automatiques et les assistants (MCP) de l'espace"],
      ["Les relances automatiques, l'assistant IA et les assistants (MCP) de l'espace sont éteints", "Les relances automatiques et les assistants (MCP) de l'espace sont éteints"],
      [" Assistant IA éteint, l'outil n'ouvre aucune connexion vers le fournisseur d'IA.", ""],
      ["Clé secrète, clés de l'assistant IA, fichier `.env`", "Clé secrète, fichier `.env`"],
      ["les jetons MCP, les clés de l'assistant IA, la clé secrète", "les jetons MCP, la clé secrète"],
      ["corbeille, assistant IA, serveur MCP", "corbeille, serveur MCP"],
      [", votre fournisseur d'identité si la connexion d'entreprise est allumée, et le fournisseur d'IA si un administrateur allume l'assistant IA.", ", et votre fournisseur d'identité si la connexion d'entreprise est allumée."],
      ["(STARTTLS et SSL), l'assistant IA et\n", "(STARTTLS et SSL) et\n"],
      ["HTTPS sortant de l'outil (assistant IA, et les autres connexions HTTPS)", "Connexions HTTPS sortantes de l'outil"],
    ],
    autreLangue: /\s*Version\s+anglaise(?:\s+de\s+référence)?\s?:\s+\[[^\]]+\]\([^)]+\)\.?/g,
  },
};
for (const L of Object.values(DOCS_OUTIL)) for (const a of AUTRES) Object.assign(L.autres[a.slug], a);

// Les guides par rôle de l'outil (manuel d'utilisation en PDF) : la section qui allume l'assistant IA facultatif, son
// bouton « Explain with AI » et sa place dans la liste des paramètres. Les sections « Connect an AI assistant » parlent
// des assistants MCP : elles restent.
export const GUIDES_COUPES = {
  en: {
    ecartees: [/^##+ Turn on the AI assistant\b/],
    lignes: [/\*\*Explain with AI\*\*/],
    remplacements: [[", the AI assistant, the assistants,", ", the assistants,"]],
    autreLangue: DOCS_OUTIL.en.autreLangue,
  },
  fr: {
    ecartees: [/^##+ Allumer l'assistant IA\b/],
    lignes: [/\*\*Expliquer avec l'IA\*\*/],
    remplacements: [[", l'assistant IA, les assistants", ", les assistants"]],
    autreLangue: DOCS_OUTIL.fr.autreLangue,
  },
};

// Une mention de l'assistant IA facultatif restée après les coupes (les assistants MCP, au pluriel ou « un assistant
// IA » qui agit par MCP, restent permis).
export const RESTES_IA = /anthropic|AI_SOCKET|AI provider|AI keys|keys of the AI|the AI assistant\b|AI assistant \(optional\)|fournisseur d'IA|clés? de l'assistant IA|l'assistant IA\b|Assistant IA \(facultatif\)/i;

// Les coupes ligne à ligne et par morceau de phrase, avant tout autre traitement. « vus » reçoit l'indice de chaque
// remplacement appliqué (pour signaler ceux qui ne trouvent plus leur texte).
export function couperTextes(texte, L, vus = new Set()) {
  let t = texte;
  L.remplacements.forEach(([de, vers, largeur], i) => {
    if (!t.includes(de)) return;
    vus.add(i);
    t = t.split(de).join(largeur ? vers.padEnd(de.length, " ") : vers);
  });
  t = t.replace(L.autreLangue, "");
  return t.split("\n").filter((l) => !L.lignes.some((r) => r.test(l))).join("\n");
}

// Nom de fichier d'un document de l'outil (tel qu'un lien Markdown le cite) → partie de la page /docs/ du site
// (« » pour le guide d'installation : la page elle-même).
export function partiesDe(L) {
  const nom = (f) => f.split("/").pop();
  return { [nom(L.installation)]: "", [nom(L.gere)]: "managed-hosting", ...Object.fromEntries(Object.entries(L.autres).map(([s, a]) => [nom(a.fichier), s])) };
}
