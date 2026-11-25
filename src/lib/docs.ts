// La documentation IT tient sur une seule page, /docs/ : l'ancre de chaque partie est le nom de son fichier
// (src/content/<langue>/docs/<nom>.md), « overview » pour la vue d'ensemble (index.md).
export const ancreDoc = (slug: string) => (slug === "index" ? "overview" : slug);
