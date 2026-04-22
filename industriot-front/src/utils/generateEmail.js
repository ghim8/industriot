export function generateEmail(nom) {
  if (!nom || nom.trim() === '') return '';
  const mots = nom.trim().split(/\s+/);
  if (mots.length < 2) return '';
  const prenom = mots[0].toLowerCase();
  const nomFamille = mots[mots.length - 1].toLowerCase();
  const initiale = prenom.charAt(0);
  // Enlève les accents
  const clean = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${clean(initiale)}.${clean(nomFamille)}@usine.local`;
}