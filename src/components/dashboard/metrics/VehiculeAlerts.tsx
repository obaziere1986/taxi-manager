"use client"

import { useState, useEffect } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Car, Wrench, ExternalLink, Calendar } from "lucide-react"
import { getVehiculeAlerts, getAlertBadgeVariant } from '@/lib/vehicule-alerts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Vehicule {
  id: string
  marque: string
  modele: string
  immatriculation: string
  prochaineVidange?: string
  prochainEntretien?: string
  prochainControleTechnique?: string
  users?: Array<{ id: string; nom: string; prenom: string; role: string }>
}

interface VehiculeWithAssignation {
  id: string
  marque: string
  modele: string
  immatriculation: string
  couleur?: string
  annee?: number
  prochaineVidange?: string
  prochainEntretien?: string
  prochainControleTechnique?: string
  isAssigned: boolean
  assignation?: {
    id: string
    dateDebut: string
    assignedTo: string
    assignedToRole: string
    assignedToId: string
  }
}

export function VehiculeAlerts() {
  const { data: session } = useAuth()
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [vehiculeInfo, setVehiculeInfo] = useState<VehiculeWithAssignation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      if (session.user.role === 'Chauffeur') {
        fetchChauffeurVehiculeInfo()
      } else {
        fetchVehicules()
      }
    }
  }, [session?.user?.id, session?.user?.role])

  const fetchChauffeurVehiculeInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vehicules/with-assignations')
      const data = await response.json()
      
      if (Array.isArray(data)) {
        // Trouver le véhicule assigné au chauffeur connecté
        const chauffeurVehicule = data.find(vehicule => 
          vehicule.assignation?.assignedToRole === 'Chauffeur' &&
          vehicule.assignation?.assignedToId === session?.user?.id
        )
        
        if (chauffeurVehicule) {
          // Récupérer les détails complets avec les dates d'entretien
          const detailsResponse = await fetch(`/api/vehicules/${chauffeurVehicule.id}`)
          const vehiculeDetails = await detailsResponse.json()
          
          setVehiculeInfo({
            ...chauffeurVehicule,
            prochaineVidange: vehiculeDetails.prochaineVidange,
            prochainEntretien: vehiculeDetails.prochainEntretien,
            prochainControleTechnique: vehiculeDetails.prochainControleTechnique
          })
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos véhicule:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vehicules')
      const data = await response.json()
      
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setVehicules(data)
      } else {
        // Gérer le cas où il n'y a pas de véhicules ou erreur API
        console.warn('Aucun véhicule trouvé ou format de données inattendu:', data)
        setVehicules([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
      setVehicules([])
    } finally {
      setLoading(false)
    }
  }

  // Obtenir tous les véhicules avec des alertes, triés par priorité
  const vehiculesAvecAlertes = vehicules
    .map(vehicule => ({
      ...vehicule,
      alerts: getVehiculeAlerts(vehicule)
    }))
    .filter(v => v.alerts.length > 0)
    .sort((a, b) => {
      // Prioriser les alertes critiques
      const aCritical = a.alerts.some(alert => alert.level === 'critical')
      const bCritical = b.alerts.some(alert => alert.level === 'critical')
      if (aCritical && !bCritical) return -1
      if (!aCritical && bCritical) return 1
      
      // Puis les alertes danger
      const aDanger = a.alerts.some(alert => alert.level === 'danger')
      const bDanger = b.alerts.some(alert => alert.level === 'danger')
      if (aDanger && !bDanger) return -1
      if (!aDanger && bDanger) return 1
      
      // Enfin trier par nombre de jours restants (le plus urgent en premier)
      const aMinDays = Math.min(...a.alerts.map(alert => Math.abs(alert.daysRemaining)))
      const bMinDays = Math.min(...b.alerts.map(alert => Math.abs(alert.daysRemaining)))
      return aMinDays - bMinDays
    })
    .slice(0, 6) // Limiter à 6 véhicules pour l'affichage

  const totalAlertes = vehicules.reduce((total, vehicule) => {
    return total + getVehiculeAlerts(vehicule).length
  }, 0)

  const alertesCritiques = vehicules.reduce((total, vehicule) => {
    return total + getVehiculeAlerts(vehicule).filter(alert => alert.level === 'critical').length
  }, 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {session?.user?.role === 'Chauffeur' ? 'Mon véhicule' : 'Alertes véhicules'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Vue spéciale pour les chauffeurs
  if (session?.user?.role === 'Chauffeur') {
    if (!vehiculeInfo) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Mon véhicule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Aucun véhicule assigné</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    const alerts = getVehiculeAlerts(vehiculeInfo)
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Mon véhicule
            {alerts.some(alert => alert.level === 'critical') && (
              <Badge variant="destructive" className="animate-pulse ml-2">
                {alerts.filter(alert => alert.level === 'critical').length} critique{alerts.filter(alert => alert.level === 'critical').length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Informations et entretien
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations véhicule */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{vehiculeInfo.marque} {vehiculeInfo.modele}</span>
                <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                  {vehiculeInfo.immatriculation}
                </Badge>
              </div>
              {vehiculeInfo.couleur && vehiculeInfo.annee && (
                <p className="text-xs text-muted-foreground">
                  {vehiculeInfo.couleur} • {vehiculeInfo.annee}
                </p>
              )}
              {vehiculeInfo.assignation && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Assigné depuis le {format(new Date(vehiculeInfo.assignation.dateDebut), 'dd/MM/yyyy', { locale: fr })}
                </div>
              )}
            </div>
          </div>

          {/* Dates d'entretien */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Prochaines échéances</h4>
            
            {vehiculeInfo.prochaineVidange && (
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">Vidange</span>
                <Badge variant={
                  alerts.find(a => a.message.includes('Vidange'))?.level === 'critical' ? 'destructive' :
                  alerts.find(a => a.message.includes('Vidange'))?.level === 'danger' ? 'secondary' : 'outline'
                }>
                  {format(new Date(vehiculeInfo.prochaineVidange), 'dd/MM/yyyy', { locale: fr })}
                </Badge>
              </div>
            )}
            
            {vehiculeInfo.prochainEntretien && (
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">Entretien</span>
                <Badge variant={
                  alerts.find(a => a.message.includes('Entretien'))?.level === 'critical' ? 'destructive' :
                  alerts.find(a => a.message.includes('Entretien'))?.level === 'danger' ? 'secondary' : 'outline'
                }>
                  {format(new Date(vehiculeInfo.prochainEntretien), 'dd/MM/yyyy', { locale: fr })}
                </Badge>
              </div>
            )}
            
            {vehiculeInfo.prochainControleTechnique && (
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">Contrôle technique</span>
                <Badge variant={
                  alerts.find(a => a.message.includes('Contrôle technique'))?.level === 'critical' ? 'destructive' :
                  alerts.find(a => a.message.includes('Contrôle technique'))?.level === 'danger' ? 'secondary' : 'outline'
                }>
                  {format(new Date(vehiculeInfo.prochainControleTechnique), 'dd/MM/yyyy', { locale: fr })}
                </Badge>
              </div>
            )}

            {!vehiculeInfo.prochaineVidange && !vehiculeInfo.prochainEntretien && !vehiculeInfo.prochainControleTechnique && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Aucune échéance programmée
              </p>
            )}
          </div>

          {/* Alertes critiques */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-orange-600">Alertes</h4>
              {alerts.map((alert, index) => (
                <Badge 
                  key={index}
                  variant={getAlertBadgeVariant(alert.level)} 
                  className={`text-xs w-full justify-start ${alert.level === 'critical' ? 'animate-pulse' : ''}`}
                >
                  <Wrench className="h-3 w-3 mr-2" />
                  {alert.message}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="w-full">
            <CardTitle className="flex items-center justify-between gap-2">
              Alertes véhicules
              {alertesCritiques > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {alertesCritiques} critique{alertesCritiques > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {totalAlertes > 0 
                ? `${totalAlertes} alerte${totalAlertes > 1 ? 's' : ''} d'entretien`
                : 'Tous les véhicules sont à jour'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vehiculesAvecAlertes.length > 0 ? (
            vehiculesAvecAlertes.map((vehicule) => {
              const alerteCritique = vehicule.alerts.find(alert => alert.level === 'critical')
              const alerteUrgente = vehicule.alerts.find(alert => alert.level === 'danger')
              const alertePrincipale = alerteCritique || alerteUrgente || vehicule.alerts[0]

              return (
                <div key={vehicule.id} className="flex items-center space-x-4 p-3 rounded-lg border bg-card">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {vehicule.marque} {vehicule.modele}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {vehicule.immatriculation}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {vehicule.alerts.map((alert, index) => (
                        <Badge 
                          key={index}
                          variant={getAlertBadgeVariant(alert.level)} 
                          className={`text-xs ${alert.level === 'critical' ? 'animate-pulse' : ''}`}
                        >
                          <Wrench className="h-3 w-3 mr-1" />
                          {alert.message}
                        </Badge>
                      ))}
                    </div>
                    
                    
                    {vehicule.users && vehicule.users.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Assigné à : {vehicule.users.filter(u => u.role === 'Chauffeur')[0]?.nom.toUpperCase()} {vehicule.users.filter(u => u.role === 'Chauffeur')[0]?.prenom}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Aucune alerte d'entretien</p>
              <p className="text-xs">Tous les véhicules sont à jour</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}