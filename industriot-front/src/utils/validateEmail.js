export function validateUsineEmail(email, slug = null) {
  if (!email) return "L'email est requis";
  
  const parts = email.split('@');
  if (parts.length !== 2 || parts[0].length < 2) return "L'email est invalide";
  
  const domain = parts[1];
  
  if (slug) {
    // Vérifier le slug spécifique de l'entreprise
    if (domain !== `${slug}.local`) {
      return `L'email doit être au format @${slug}.local`;
    }
  } else {
    // Vérifier que ça se termine par .local
    if (!domain.endsWith('.local')) {
      return "L'email doit être au format @entreprise.local";
    }
  }
  
  return null;
}