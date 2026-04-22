export function validateUsineEmail(email) {
  if (!email) return 'L\'email est requis';
  if (!email.endsWith('@usine.local')) return 'L\'email doit être au format @usine.local';
  const parts = email.split('@');
  if (parts[0].length < 2) return 'L\'email est invalide';
  return null; // pas d'erreur
}