"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

export function ChauffeurPerformance() {
  const [data, setData] = useState<ChauffeurPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/analytics/chauffeur-performance')
      const performanceData = await response.json()
      // Prendre seulement les 6 meilleurs pour l'affichage
      setData(performanceData.slice(0, 6))
    } catch (error) {
      console.error('Erreur lors du chargement performance:', error)
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
          <div className="mt-2 space-y-1">
            <p className="text-sm">Courses terminées: <span className="font-medium text-green-600">{data.coursesTerminees}</span></p>
            <p className="text-sm">Revenus: <span className="font-medium text-yellow-600">{data.revenu}€</span></p>
            <p className="text-sm">Efficacité: <span className="font-medium">{data.tauxEfficacite}%</span></p>
            <p className="text-sm">Temps conduite: <span className="font-medium">{data.tempsConducte}h</span></p>
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
          <CardDescription>Performances du mois en cours</CardDescription>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Chauffeurs</CardTitle>
        <CardDescription>Les 6 meilleurs chauffeurs du mois</CardDescription>
      </CardHeader>
      <CardContent>
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
              <Bar 
                dataKey="revenu" 
                fill="hsl(45 93% 47%)" 
                name="Revenus (€)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}