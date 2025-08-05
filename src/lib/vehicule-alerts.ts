import { differenceInDays, differenceInWeeks, differenceInMonths } from 'date-fns'

export interface VehiculeAlert {
  type: 'vidange' | 'entretien' | 'controle'
  level: 'info' | 'warning' | 'danger' | 'critical'
  message: string
  date: Date
  daysRemaining: number
  isOverdue: boolean
}

export function getVehiculeAlerts(vehicule: {
  prochaineVidange?: string | Date | null
  prochainEntretien?: string | Date | null 
  prochainControleTechnique?: string | Date | null
}): VehiculeAlert[] {
  const now = new Date()
  const alerts: VehiculeAlert[] = []

  // Fonction helper pour déterminer le niveau d'alerte
  const getAlertLevel = (daysRemaining: number, isOverdue: boolean): VehiculeAlert['level'] => {
    if (isOverdue) return 'critical' // Rouge clignotant
    if (daysRemaining <= 7) return 'danger' // Rouge (1 semaine)
    if (daysRemaining <= 30) return 'warning' // Orange (1 mois)
    if (daysRemaining <= 90) return 'info' // Jaune (3 mois)
    return 'info'
  }

  // Fonction helper pour créer le message avec date
  const getMessage = (type: string, daysRemaining: number, isOverdue: boolean, date: Date): string => {
    const typeLabel = type === 'vidange' ? 'Vidange' : 
                     type === 'entretien' ? 'Entretien' : 
                     'CT'

    const formattedDate = date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    })

    if (isOverdue) {
      const daysOverdue = Math.abs(daysRemaining)
      return `${typeLabel} ${formattedDate} (${daysOverdue}j retard)`
    }

    if (daysRemaining <= 7) {
      return `${typeLabel} ${formattedDate} (${daysRemaining}j)`
    }

    if (daysRemaining <= 30) {
      const weeks = Math.ceil(daysRemaining / 7)
      return `${typeLabel} ${formattedDate} (${weeks}sem)`
    }

    const months = Math.ceil(daysRemaining / 30)
    return `${typeLabel} ${formattedDate} (${months}mois)`
  }

  // Vérifier la vidange
  if (vehicule.prochaineVidange) {
    const date = new Date(vehicule.prochaineVidange)
    const daysRemaining = differenceInDays(date, now)
    const isOverdue = daysRemaining < 0

    if (isOverdue || daysRemaining <= 90) {
      alerts.push({
        type: 'vidange',
        level: getAlertLevel(daysRemaining, isOverdue),
        message: getMessage('vidange', daysRemaining, isOverdue, date),
        date,
        daysRemaining,
        isOverdue
      })
    }
  }

  // Vérifier l'entretien
  if (vehicule.prochainEntretien) {
    const date = new Date(vehicule.prochainEntretien)
    const daysRemaining = differenceInDays(date, now)
    const isOverdue = daysRemaining < 0

    if (isOverdue || daysRemaining <= 90) {
      alerts.push({
        type: 'entretien',
        level: getAlertLevel(daysRemaining, isOverdue),
        message: getMessage('entretien', daysRemaining, isOverdue, date),
        date,
        daysRemaining,
        isOverdue
      })
    }
  }

  // Vérifier le contrôle technique
  if (vehicule.prochainControleTechnique) {
    const date = new Date(vehicule.prochainControleTechnique)
    const daysRemaining = differenceInDays(date, now)
    const isOverdue = daysRemaining < 0

    if (isOverdue || daysRemaining <= 90) {
      alerts.push({
        type: 'controle',
        level: getAlertLevel(daysRemaining, isOverdue),
        message: getMessage('controle', daysRemaining, isOverdue, date),
        date,
        daysRemaining,
        isOverdue
      })
    }
  }

  // Trier par priorité (overdue first, puis par nombre de jours restants)
  return alerts.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1
    if (!a.isOverdue && b.isOverdue) return 1
    return a.daysRemaining - b.daysRemaining
  })
}

// Fonction pour obtenir le style CSS selon le niveau d'alerte
export function getAlertStyle(level: VehiculeAlert['level']) {
  switch (level) {
    case 'critical':
      return 'bg-red-500 text-white animate-pulse' // Rouge clignotant
    case 'danger':
      return 'bg-red-500 text-white' // Rouge
    case 'warning':
      return 'bg-orange-500 text-white' // Orange
    case 'info':
      return 'bg-yellow-500 text-black' // Jaune
    default:
      return 'bg-gray-500 text-white'
  }
}

// Fonction pour obtenir la variante de Badge
export function getAlertBadgeVariant(level: VehiculeAlert['level']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level) {
    case 'critical':
    case 'danger':
      return 'destructive'
    case 'warning':
      return 'secondary'
    case 'info':
      return 'outline'
    default:
      return 'default'
  }
}