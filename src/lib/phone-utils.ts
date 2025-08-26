/**
 * Formate un numéro de téléphone pour l'affichage
 * @param phone - Le numéro de téléphone brut (ex: "0612345678" ou "+33 6 12 34 56 78")
 * @returns Le numéro formaté (ex: "06 12 34 56 78")
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return ''
  
  // Si c'est déjà formaté avec un indicatif international, le retourner tel quel
  if (phone.startsWith('+')) {
    return phone
  }
  
  // Nettoyer le numéro (garder seulement les chiffres)
  const cleaned = phone.replace(/[^\d]/g, '')
  
  // Format français (10 chiffres)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }
  
  // Format français sans le 0 initial (9 chiffres)
  if (cleaned.length === 9) {
    return `0${cleaned}`.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }
  
  // Autres formats - grouper par 2 chiffres
  if (cleaned.length > 0) {
    return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }
  
  return phone
}