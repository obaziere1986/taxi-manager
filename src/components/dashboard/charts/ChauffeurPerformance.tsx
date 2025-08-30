"use client"

import { useState, useEffect } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Trophy, Target, TrendingUp } from "lucide-react"
import { getDefaultBadge } from '@/lib/badge-utils'

interface ChauffeurPerformance {
  id: string
  nom: string
  prenom: string
  vehicule: string
  statut: string
  coursesTerminees: number
}

export function ChauffeurPerformance() {
  const { data: session } = useAuth()
  const [data, setData] = useState<ChauffeurPerformance[]>([])
  const [allData, setAllData] = useState<ChauffeurPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/analytics/chauffeur-performance')
      const performanceData = await response.json()
      
      // Vérifier que performanceData est un tableau
      if (Array.isArray(performanceData)) {
        setAllData(performanceData) // Garder toutes les données
        setData(performanceData.slice(0, 6)) // Top 6 pour le graphique
      } else {
        console.error('Données invalides:', performanceData)
        setData([])
        setAllData([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement performance:', error)
      setData([])
      setAllData([])
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${data.prenom} ${data.nom.toUpperCase()}`}</p>
          <p className="text-sm text-muted-foreground">{data.vehicule}</p>
          <div className="mt-2">
            <p className="text-sm">Courses terminées: <span className="font-medium text-green-600">{data.coursesTerminees}</span></p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Chauffeurs</CardTitle>
          <CardDescription>Courses terminées - 30 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div>Chargement...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(chauffeur => ({
    ...chauffeur,
    nom: `${chauffeur.prenom} ${chauffeur.nom.slice(0, 1).toUpperCase()}.`
  }))

  // Trouver la position du chauffeur connecté
  const currentChauffeurPosition = session?.user?.role === 'Chauffeur' ? 
    allData.findIndex(chauffeur => 
      chauffeur.id === session.user.id || 
      (chauffeur.nom.includes(session.user.name?.split(' ')[1] || '') && 
       chauffeur.prenom.includes(session.user.name?.split(' ')[0] || ''))
    ) + 1 : null

  const currentChauffeurData = currentChauffeurPosition ? allData[currentChauffeurPosition - 1] : null
  const isInTop6 = currentChauffeurPosition && currentChauffeurPosition <= 6
  const top6MinCourses = data.length > 0 ? data[data.length - 1].coursesTerminees : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Chauffeurs
        </CardTitle>
        <CardDescription>Classement des 6 meilleurs - 30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="nom" 
                className="text-xs"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="coursesTerminees" 
                fill="hsl(142 76% 36%)" 
                name="Courses terminées"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Afficher la position du chauffeur connecté s'il n'est pas dans le top 6 */}
        {session?.user?.role === 'Chauffeur' && currentChauffeurPosition && !isInTop6 && currentChauffeurData && (
          <div className="border-t pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Votre position</span>
                </div>
                <Badge variant="outline" className="text-xs font-medium px-2 py-1 border-blue-300 text-blue-700">
                  #{currentChauffeurPosition}
                </Badge>
              </div>
              <div className="text-sm text-blue-700">
                <div className="flex justify-between items-center">
                  <span>Courses terminées :</span>
                  <span className="font-medium">{currentChauffeurData.coursesTerminees}</span>
                </div>
                {top6MinCourses > currentChauffeurData.coursesTerminees && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>
                      {top6MinCourses - currentChauffeurData.coursesTerminees} course{top6MinCourses - currentChauffeurData.coursesTerminees > 1 ? 's' : ''} pour intégrer le top 6
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message d'encouragement si dans le top 6 */}
        {session?.user?.role === 'Chauffeur' && currentChauffeurPosition && isInTop6 && (
          <div className="border-t pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Félicitations ! Vous êtes #{currentChauffeurPosition} au classement
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}