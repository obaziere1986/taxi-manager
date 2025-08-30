"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from '@/components/page-header'
import { Car, Calendar, Users, MapPin } from "lucide-react"
import { startOfDay, endOfDay } from 'date-fns'
import { CoursesTimeline } from '@/components/dashboard/charts/CoursesTimeline'
import { ChauffeurPerformance } from '@/components/dashboard/charts/ChauffeurPerformance'
import { VehiculeAlerts } from '@/components/dashboard/metrics/VehiculeAlerts'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface DashboardStats {
  coursesToday: number
  coursesYesterday: number
  chauffeursActifs: number
  totalChauffeurs: number
  totalClients: number
  coursesEnAttente: number
  recentCourses: any[]
  availableChauffeurs: any[]
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    coursesToday: 0,
    coursesYesterday: 0,
    chauffeursActifs: 0,
    totalChauffeurs: 0,
    totalClients: 0,
    coursesEnAttente: 0,
    recentCourses: [],
    availableChauffeurs: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/current-user')
      const result = await response.json()
      
      if (result.success) {
        setUser(result.user)
        fetchDashboardData(result.user)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error)
      setLoading(false)
    }
  }

  const fetchDashboardData = async (currentUser: User) => {
    try {
      // Pour les chauffeurs, ne charger que les cours qui leur sont assignées
      const coursesUrl = currentUser?.role === 'Chauffeur' ? `/api/courses?userId=${currentUser.id}` : '/api/courses'
      
      const [coursesRes, usersRes, clientsRes] = await Promise.all([
        fetch(coursesUrl),
        fetch('/api/users'),
        fetch('/api/clients')
      ])

      // Vérifier que les réponses sont OK et contiennent du JSON
      if (!coursesRes.ok || !usersRes.ok || !clientsRes.ok) {
        throw new Error('Erreur lors du chargement des données')
      }

      const [courses, users, clients] = await Promise.all([
        coursesRes.json(),
        usersRes.json(),
        clientsRes.json()
      ])

      // Filtrer les chauffeurs parmi les utilisateurs
      const chauffeurs = Array.isArray(users) ? users.filter(user => user.role === 'Chauffeur') : []
      
      // Si c'est un chauffeur, ne pas afficher les stats des autres chauffeurs
      const visibleChauffeurs = currentUser?.role === 'Chauffeur' ? 
        chauffeurs.filter(c => c.id === currentUser.id) : chauffeurs

      // Vérifier que les données sont des tableaux
      if (!Array.isArray(courses) || !Array.isArray(users) || !Array.isArray(clients)) {
        console.error('Données invalides reçues:', { courses, users, clients })
        throw new Error('Format de données invalide')
      }

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const todayStart = startOfDay(today)
      const todayEnd = endOfDay(today)
      const yesterdayStart = startOfDay(yesterday)
      const yesterdayEnd = endOfDay(yesterday)

      const coursesToday = courses.filter((course: any) => {
        const courseDate = new Date(course.dateHeure)
        return courseDate >= todayStart && courseDate <= todayEnd
      })

      const coursesYesterday = courses.filter((course: any) => {
        const courseDate = new Date(course.dateHeure)
        return courseDate >= yesterdayStart && courseDate <= yesterdayEnd
      })

      const chauffeursActifs = visibleChauffeurs.filter((c: any) => c.statut === 'DISPONIBLE' || c.statut === 'OCCUPE')
      const availableChauffeurs = visibleChauffeurs.filter((c: any) => c.statut === 'DISPONIBLE').slice(0, 5)
      const coursesEnAttente = coursesToday.filter((c: any) => c.statut === 'EN_ATTENTE')
      const recentCourses = courses
        .filter((c: any) => c.statut === 'TERMINEE')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      setStats({
        coursesToday: coursesToday.length,
        coursesYesterday: coursesYesterday.length,
        chauffeursActifs: chauffeursActifs.length,
        totalChauffeurs: visibleChauffeurs.length,
        totalClients: clients.length,
        coursesEnAttente: coursesEnAttente.length,
        recentCourses,
        availableChauffeurs
      })
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGrowthPercentage = () => {
    if (stats.coursesYesterday === 0) return stats.coursesToday > 0 ? '+100%' : '0%'
    const growth = ((stats.coursesToday - stats.coursesYesterday) / stats.coursesYesterday) * 100
    return growth > 0 ? `+${Math.round(growth)}%` : `${Math.round(growth)}%`
  }

  // Extraire le prénom de l'utilisateur
  const firstName = user?.name?.split(' ')[0] || 'Utilisateur'
  const dashboardTitle = `Dashboard de ${firstName}`

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <PageHeader title={dashboardTitle} />
        <div className="flex-1 p-6">
          <div>Chargement...</div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title={dashboardTitle} />
      <div className="flex-1 p-6 space-y-6">
        
        {/* KPIs de base */}
        <div className={`grid gap-4 ${user?.role === 'Chauffeur' ? 'md:grid-cols-3 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses du jour</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coursesToday}</div>
              <p className="text-xs text-muted-foreground">
                {getGrowthPercentage()} par rapport à hier
              </p>
            </CardContent>
          </Card>
          
          {/* Masquer la carte chauffeurs actifs pour les chauffeurs */}
          {user?.role !== 'Chauffeur' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chauffeurs actifs</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chauffeursActifs}</div>
                <p className="text-xs text-muted-foreground">
                  Sur {stats.totalChauffeurs} chauffeurs
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">Clients enregistrés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coursesEnAttente}</div>
              <p className="text-xs text-muted-foreground">Courses à assigner</p>
            </CardContent>
          </Card>
        </div>


        {/* Graphiques principaux */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CoursesTimeline />
          <ChauffeurPerformance />
        </div>

        {/* Section détaillée */}
        <div className={`grid gap-6 ${user?.role === 'Chauffeur' ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-3'}`}>
                    
          {/* Alertes véhicules */}
          <VehiculeAlerts />
          
          {/* Courses récentes */}
          <Card>
            <CardHeader>
              <CardTitle>Courses récentes</CardTitle>
              <CardDescription>Les dernières courses terminées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentCourses.length > 0 ? (
                  stats.recentCourses.map((course: any) => (
                    <div key={course.id} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{course.origine} → {course.destination}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.client.nom.toUpperCase()}, {course.client.prenom} - {new Date(course.dateHeure).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à {new Date(course.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune course récente</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Chauffeurs disponibles - uniquement pour Admin/Planner */}
          {user?.role !== 'Chauffeur' && (
            <Card>
              <CardHeader>
                <CardTitle>Équipe disponible</CardTitle>
                <CardDescription>Chauffeurs prêts à prendre des courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.availableChauffeurs.length > 0 ? (
                    stats.availableChauffeurs.map((chauffeur: any) => (
                      <div key={chauffeur.id} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{chauffeur.nom.toUpperCase()}, {chauffeur.prenom}</p>
                          <p className="text-xs text-muted-foreground">{chauffeur.vehicule} - Disponible</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun chauffeur disponible</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
