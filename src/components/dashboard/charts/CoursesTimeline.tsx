"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface TimelineData {
  date: string
  fullDate: string
  courses: number
  coursesTerminees: number
  coursesEnAttente: number
  coursesEnCours: number
  coursesAnnulees: number
  revenu: number
  chauffeurs: number
}

export function CoursesTimeline() {
  const [data, setData] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimelineData()
  }, [])

  const fetchTimelineData = async () => {
    try {
      const response = await fetch('/api/analytics/courses-timeline')
      const timelineData = await response.json()
      setData(timelineData)
    } catch (error) {
      console.error('Erreur lors du chargement timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey === 'revenu' ? 'Revenus' : 
                 entry.dataKey === 'courses' ? 'Total courses' :
                 entry.dataKey === 'coursesTerminees' ? 'Terminées' :
                 entry.dataKey === 'chauffeurs' ? 'Chauffeurs actifs' : entry.dataKey}: ${
                entry.dataKey === 'revenu' ? entry.value + '€' : entry.value
              }`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution des courses</CardTitle>
          <CardDescription>Activité des 7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div>Chargement...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des courses</CardTitle>
        <CardDescription>Activité et revenus des 7 derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="courses" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total courses"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="coursesTerminees" 
                stroke="hsl(142 76% 36%)" 
                strokeWidth={2}
                name="Terminées"
                dot={{ fill: 'hsl(142 76% 36%)' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenu" 
                stroke="hsl(45 93% 47%)" 
                strokeWidth={2}
                name="Revenus (€)"
                dot={{ fill: 'hsl(45 93% 47%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}