"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Car, Wrench, ExternalLink } from "lucide-react"
import { getVehiculeAlerts, getAlertBadgeVariant } from '@/lib/vehicule-alerts'
import Link from 'next/link'

interface Vehicule {
  id: string
  marque: string
  modele: string
  immatriculation: string
  prochaineVidange?: string
  prochainEntretien?: string
  prochainControleTechnique?: string
  chauffeurs?: Array<{ id: string; nom: string; prenom: string }>
}

export function VehiculeAlerts() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVehicules()
  }, [])

  const fetchVehicules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vehicules')
      const data = await response.json()
      setVehicules(data)
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
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
            <AlertTriangle className="h-5 w-5" />
            Alertes véhicules
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
                    
                    
                    {vehicule.chauffeurs && vehicule.chauffeurs.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Assigné à : {vehicule.chauffeurs[0].nom.toUpperCase()} {vehicule.chauffeurs[0].prenom}
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