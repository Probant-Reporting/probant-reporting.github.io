// Couleurs du site et de l'outil reproduit, écrites une seule fois, en clair et en sombre.
// Les couleurs de l'outil (noms français, comme dans static/css/outil.css) sont celles de sa palette fournie
// « Ardoise », calculées par son propre code (parametres/couleurs.py : gamme, gamme_sombre).

const clair = {
  // site
  "--paper": "#F8F7F3", "--paper-2": "#EFEDE6", "--card": "#FFFFFF", "--ink": "#171A1F", "--ink-soft": "#555A62",
  "--line": "#DAD7CE", "--line-strong": "#8A8880", "--brand-hover": "#586374", "--brand": "#334155", "--brand-text": "#334155", "--on-brand": "#FFFFFF",
  "--band": "#334155", "--band-ink": "#FFFFFF", "--band-btn": "#F8F7F3", "--band-btn-hover": "#FFFFFF", "--band-btn-ink": "#171A1F", "--bezel": "#171A1F",
  "--brand-tint": "#E9EAEC", "--mark": "#334155",
  // outil (palette Ardoise)
  "--principale-survol": "#586374", "--principale": "#334155", "--principale-claire": "#A9AFB8", "--principale-teinte": "#E9EAEC",
  "--principale-pale": "#F5F6F6", "--accent-claire": "#8DC8E6", "--texte": "#0F172A", "--texte-doux": "#595F6D",
  "--fond": "#F5F7FA", "--surface": "#FCFDFE", "--entete-table": "#FAFBFC", "--bord": "#E0E3E7", "--bord-doux": "#E7EAEE",
  "--bord-fort": "#D2D5DB", "--neutre": "#E5E7EB", "--erreur": "#D92D20", "--erreur-texte": "#9B1C1C", "--erreur-teinte": "#FDECEC",
  "--principale-texte": "#334155", "--principale-bord": "#334155", "--sur-principale": "#FFFFFF", "--contour": "#888C96",
  "--bandeau": "#334155", "--sur-bandeau": "#FFFFFF", "--bandeau-filet": "#334155", "--bandeau-survol": "#2A3546",
  "--bandeau-actif": "#FFFFFF", "--sur-bandeau-actif": "#334155", "--vert-pale": "#D7F3E6", "--vert-texte": "#0B6644",
  "--barre-valide": "#2E9E68", "--jaune-pale": "#FFF5C2", "--jaune-texte": "#6A5A00", "--barre-brouillon": "#E3B530",
  "--orange": "#A86F00", "--orange-pale": "#FFF1D6", "--orange-bord": "#E8C98A", "--orange-texte": "#7A4F00",
  "--bleu3": "#E2E9FD", "--bleu-texte": "#2B4596", "--surface-vive": "#FFFFFF", "--fond-logo": "#FFFFFF",
  "--ombre-flottante": "0 8px 24px rgba(20, 24, 32, .14)", "--ombre-panneau": "-8px 0 24px rgba(0, 0, 0, .12)",
  "--voile": "rgba(20, 24, 32, .32)", "--viz-1": "#2A78D6", "--viz-n1": "#7A828A",
  "--niv-groupe-fond": "#DBE0E8", "--niv-groupe": "#1D3F6E", "--niv-pays-fond": "#FAEADB", "--niv-pays": "#9D5516",
  "--niv-site-fond": "#D9EFEF", "--niv-site": "#0A6E6C", "--type-fond": "#E8ECF2", "--type": "#3D4A5C",
};

const sombre = {
  "--paper": "#121418", "--paper-2": "#191C21", "--card": "#1E2127", "--ink": "#E8E9EC", "--ink-soft": "#A9ACB2",
  "--line": "#2E3138", "--line-strong": "#7F8186", "--brand-hover": "#FFFFFF", "--brand": "#E8E9EC", "--brand-text": "#A5ABB4", "--on-brand": "#121418",
  "--band": "#1D2433", "--band-ink": "#E8E9EC", "--band-btn": "#E8E9EC", "--band-btn-hover": "#FFFFFF", "--band-btn-ink": "#121418", "--bezel": "#7F8186",
  "--brand-tint": "#1D2433", "--mark": "#A5ABB4",
  "--principale-survol": "#354050", "--principale": "#3F4C5F", "--principale-claire": "#252F3F", "--principale-teinte": "#1D2433",
  "--principale-pale": "#191F2C", "--accent-claire": "#0A537E", "--texte": "#DEE1E5", "--texte-doux": "#A9ACB2",
  "--fond": "#141824", "--surface": "#20242F", "--entete-table": "#292D38", "--bord": "#353843", "--bord-doux": "#2C2F3A",
  "--bord-fort": "#4C4F59", "--neutre": "#30343E", "--erreur": "#D92D20", "--erreur-texte": "#E77D75", "--erreur-teinte": "#4C262B",
  "--principale-texte": "#A5ABB4", "--principale-bord": "#78828F", "--sur-principale": "#FFFFFF", "--contour": "#7E8088",
  "--bandeau": "#20242F", "--sur-bandeau": "#DEE1E5", "--bandeau-filet": "#78828F", "--bandeau-survol": "#191F2C",
  "--bandeau-actif": "#1D2433", "--sur-bandeau-actif": "#DEE1E5", "--vert-pale": "#1D423D", "--vert-texte": "#0EC97E",
  "--barre-valide": "#2E9E68", "--jaune-pale": "#433E2F", "--jaune-texte": "#E3B530", "--barre-brouillon": "#E3B530",
  "--orange": "#D98E04", "--orange-pale": "#443B31", "--orange-bord": "#846334", "--orange-texte": "#E8A23A",
  "--bleu3": "#2E3752", "--bleu-texte": "#86A0F2", "--surface-vive": "#272A36", "--fond-logo": "#EEF0F2",
  "--ombre-flottante": "0 8px 24px rgba(0, 0, 0, .5)", "--ombre-panneau": "-8px 0 24px rgba(0, 0, 0, .45)",
  "--voile": "rgba(0, 0, 0, .6)", "--viz-1": "#4A8FE3", "--viz-n1": "#9AA0A6",
  "--niv-groupe-fond": "#212C3E", "--niv-groupe": "#8597B1", "--niv-pays-fond": "#573C28", "--niv-pays": "#E99F5E",
  "--niv-site-fond": "#1D464A", "--niv-site": "#5CBCBA", "--type-fond": "#303845", "--type": "#99A3B3",
};

const bloc = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(";");

/** CSS des couleurs : clair par défaut ; sombre si le système le demande (sauf choix « clair ») ou si choisi. */
export const cssTokens =
  `:root{color-scheme:light;${bloc(clair)}}` +
  `@media (prefers-color-scheme:dark){:root:not([data-theme=light]){color-scheme:dark;${bloc(sombre)}}}` +
  `:root[data-theme=dark]{color-scheme:dark;${bloc(sombre)}}`;

export const couleurs = { clair, sombre };
