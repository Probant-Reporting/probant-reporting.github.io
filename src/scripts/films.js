// Un grand bouton de lecture sur l'image d'attente : sans lui, le film ne part que par le petit bouton des commandes
// du navigateur, en bas à gauche. Posé par le script, donc jamais affiché sans JavaScript (où les commandes suffisent).
for (const video of document.querySelectorAll(".film-video")) {
  const cadre = video.closest(".film");
  if (!cadre) continue;
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "film-lecture";
  bouton.setAttribute("aria-label", cadre.dataset.lecture || "Play");
  bouton.innerHTML = '<span class="film-lecture-rond" aria-hidden="true"><svg viewBox="0 0 46 52" width="40" height="45"><path d="M3 3.2 43 26 3 48.8Z" fill="currentColor" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/></svg></span>';
  bouton.addEventListener("click", () => { video.play(); });
  video.addEventListener("play", () => bouton.remove());
  video.insertAdjacentElement("afterend", bouton);
  cadre.classList.add("film-avec-bouton");
}
