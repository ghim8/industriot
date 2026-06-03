export function generateEmail(nom, slug = 'usine') {
  if (!nom || nom.trim() === '') return '';
  const mots = nom.trim().split(/\s+/);
  if (mots.length < 2) return '';

  const clean = (str) => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const prenom     = clean(mots[0]);
  const nomFamille = clean(mots.slice(1).join(''));

  // ← première lettre du prénom seulement
  return `${prenom.charAt(0)}.${nomFamille}@${slug}.local`;
}