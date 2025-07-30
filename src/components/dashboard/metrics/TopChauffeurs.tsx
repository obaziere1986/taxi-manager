"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Car, Clock, DollarSign } from 'lucide-react'

interface ChauffeurPerformance {
  id: string
  nom: string
  prenom: string
  vehicule: string
  statut: string
  totalCourses: number
  coursesTerminees: number
  coursesEnCours: number
  coursesAnnulees: number
  revenu: number
  tempsConducte: number
  tauxEfficacite: number
  moyennePrixCourse: number
}

export function TopChauffeurs() {
  const [chauffeurs, setChauffeurs] = useState<ChauffeurPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChauffeurData()
  }, [])

  const fetchChauffeurData = async () => {
    try {
      const response = await fetch('/api/analytics/chauffeur-performance')
      const data = await response.json()
      setChauffeurs(data.slice(0, 5)) // Top 5 chauffeurs
    } catch (error) {
      console.error('Erreur lors du chargement chauffeurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1: return <Medal className="h-5 w-5 text-gray-400" />
      case 2: return <Award className="h-5 w-5 text-amber-600" />
      default: return <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{index + 1}</div>
    }
  }

  const getStatutBadge = (statut: string) => {
    const variants = {
      'DISPONIBLE': { variant: 'default' as const, color: 'text-green-600' },
      'OCCUPE': { variant: 'secondary' as const, color: 'text-orange-600' },
      'HORS_SERVICE': { variant: 'outline' as const, color: 'text-red-600' }
    }
    const config = variants[statut as keyof typeof variants] || variants.DISPONIBLE
    return (
      <Badge variant={config.variant} className={config.color}>
        {statut.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Chauffeurs</CardTitle>
          <CardDescription>Classement des performances du mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Chauffeurs
        </CardTitle>
        <CardDescription>Classement des performances du mois en cours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chauffeurs.map((chauffeur, index) => (
            <div 
              key={chauffeur.id}
              className={`flex items-center space-x-4 p-3 rounded-lg border transition-colors ${
                index === 0 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
                index === 1 ? 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800' :
                index === 2 ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' :
                'bg-muted/30'
              }`}
            >
              {/* Rang */}
              <div className="flex-shrink-0">
                {getRankIcon(index)}
              </div>

              {/* Infos chauffeur */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {chauffeur.prenom} {chauffeur.nom.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Car className="h-3 w-3 mr-1" />
                      {chauffeur.vehicule}
                    </p>
                  </div>
                  {getStatutBadge(chauffeur.statut)}
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="font-medium">{chauffeur.coursesTerminees}</span>
                    <span className="text-muted-foreground ml-1">courses</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1 text-yellow-600" />
                    <span className="font-medium">{chauffeur.revenu}€</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-blue-600" />
                    <span className="font-medium">{chauffeur.tempsConducte}h</span>
                  </div>
                </div>

                {/* Barre d'efficacité */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Efficacité</span>
                    <span className="font-medium">{chauffeur.tauxEfficacite}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        chauffeur.tauxEfficacite >= 90 ? 'bg-green-500' :
                        chauffeur.tauxEfficacite >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(chauffeur.tauxEfficacite, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {chauffeurs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucune donnée de performance disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}