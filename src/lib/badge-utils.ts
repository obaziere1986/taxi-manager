// Utilitaires pour des badges uniformes à travers l'application

export type BadgeType = 
  | 'statut-course' 
  | 'statut-user' 
  | 'role' 
  | 'vehicule-alerte'
  | 'assignation'
  | 'default'

export interface BadgeStyle {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

// Styles uniformes pour les badges de statut de course
export function getCourseStatusBadge(statut: string): BadgeStyle {
  const baseClasses = "text-xs font-medium px-2 py-1 text-white border-0"
  
  switch (statut) {
    case 'EN_ATTENTE':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-gray-500 text-white`
      }
    case 'ASSIGNEE':
      return {
        variant: 'outline', 
        className: `${baseClasses} bg-blue-500 text-white`
      }
    case 'EN_COURS':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-orange-500 text-white`
      }
    case 'TERMINEE':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-green-500 text-white`
      }
    case 'ANNULEE':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-red-500 text-white`
      }
    default:
      return {
        variant: 'outline',
        className: `${baseClasses} bg-gray-500 text-white`
      }
  }
}

// Styles uniformes pour les badges de statut utilisateur
export function getUserStatusBadge(statut: string): BadgeStyle {
  const baseClasses = "text-xs font-medium px-2 py-1 ml-2"
  
  switch (statut) {
    case 'DISPONIBLE':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-green-100 text-green-800 border-green-300`
      }
    case 'OCCUPE':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-orange-100 text-orange-800 border-orange-300`
      }
    case 'HORS_SERVICE':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-red-100 text-red-800 border-red-300`
      }
    default:
      return {
        variant: 'outline',
        className: `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`
      }
  }
}

// Styles uniformes pour les badges de rôle
export function getRoleBadge(role: string): BadgeStyle {
  const baseClasses = "text-xs font-medium px-2 py-1"
  
  switch (role) {
    case 'Admin':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-black text-white border-black`
      }
    case 'Planner':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-gray-500 text-white border-gray-500`
      }
    case 'Chauffeur':
      return {
        variant: 'outline',
        className: `${baseClasses} bg-white text-black border-gray-300`
      }
    default:
      return {
        variant: 'outline',
        className: baseClasses
      }
  }
}

// Styles uniformes pour les alertes véhicules
export function getVehiculeAlertBadge(level: 'info' | 'warning' | 'danger' | 'critical'): BadgeStyle {
  const baseClasses = "text-xs font-medium px-2 py-1"
  
  switch (level) {
    case 'critical':
      return {
        variant: 'destructive',
        className: `${baseClasses} animate-pulse`
      }
    case 'danger':
      return {
        variant: 'secondary',
        className: `${baseClasses} bg-orange-100 text-orange-800 border-orange-300`
      }
    case 'warning':
      return {
        variant: 'secondary',
        className: `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-300`
      }
    case 'info':
      return {
        variant: 'outline',
        className: baseClasses
      }
    default:
      return {
        variant: 'outline',
        className: baseClasses
      }
  }
}

// Styles uniformes pour les badges d'assignation
export function getAssignationBadge(actif: boolean): BadgeStyle {
  const baseClasses = "text-xs font-medium px-2 py-1"
  
  return {
    variant: actif ? 'default' : 'secondary',
    className: baseClasses
  }
}

// Badge générique uniforme
export function getDefaultBadge(): BadgeStyle {
  return {
    variant: 'outline',
    className: "text-xs font-medium px-2 py-1"
  }
}

// Badge pour le statut inactif
export function getInactiveBadge(): BadgeStyle {
  return {
    variant: 'outline',
    className: "text-xs font-medium px-2 py-1 bg-red-500 text-white border-red-500"
  }
}

// Classes uniformes pour tous les badges
export const UNIFORM_BADGE_CLASSES = "text-xs font-medium px-2 py-1"

// Fonction helper pour formater les statuts
export function formatStatut(statut: string): string {
  const statutMap: { [key: string]: string } = {
    'EN_ATTENTE': 'En attente',
    'ASSIGNEE': 'Assignée',
    'EN_COURS': 'En cours',
    'TERMINEE': 'Terminée',
    'ANNULEE': 'Annulée',
    'DISPONIBLE': 'Disponible',
    'OCCUPE': 'Occupé',
    'HORS_SERVICE': 'Hors service'
  }
  return statutMap[statut] || statut
}