"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TimelinePlanning } from '@/components/planning/timeline-planning'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Course {
  id: string
  origine: string
  destination: string
  dateHeure: string
  statut: string
  client: {
    nom: string
    prenom: string
  }
  chauffeur?: {
    nom: string
    prenom: string
    id: string
  } | null
}

interface Chauffeur {
  id: string
  nom: string
  prenom: string
  telephone: string
  vehicule: string
  statut: string
}

export default function PlanningPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [courses, setCourses] = useState<Course[]>([])
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      const [coursesRes, chauffeursRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/chauffeurs')
      ])

      const [coursesData, chauffeursData] = await Promise.all([
        coursesRes.json(),
        chauffeursRes.json()
      ])

      // Filtrer les courses pour la date sélectionnée
      const dayStart = startOfDay(selectedDate)
      const dayEnd = endOfDay(selectedDate)
      
      const filteredCourses = coursesData.filter((course: Course) => {
        const courseDate = new Date(course.dateHeure)
        return courseDate >= dayStart && courseDate <= dayEnd
      })

      setCourses(filteredCourses)
      setChauffeurs(chauffeursData)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseAssign = async (courseId: string, chauffeurId: string | null) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chauffeurId: chauffeurId
        }),
      })

      if (response.ok) {
        fetchData() // Recharger les données
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
    }
  }

  const getCoursesForChauffeur = (chauffeurId: string) => {
    return courses.filter(course => course.chauffeur?.id === chauffeurId)
  }

  const getUnassignedCourses = () => {
    return courses.filter(course => !course.chauffeur)
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1))
    } else {
      setSelectedDate(addDays(selectedDate, 1))
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Planning</h2>
        </div>
        <div>Chargement...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Planning Timeline</h2>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-md border-0 font-medium cursor-pointer"
          />
          
          <div className="flex items-center space-x-2 px-2 py-2 bg-muted rounded-md text-sm">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">
              {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date())}
          >
            Aujourd&apos;hui
          </Button>
        </div>
      </div>

      {/* Vue Timeline */}
      <div className="flex-1">
        <TimelinePlanning 
          courses={courses}
          chauffeurs={chauffeurs}
          onCourseAssign={handleCourseAssign}
        />
      </div>

      {/* Statistiques du jour */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total courses</div>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">En attente</div>
            <div className="text-2xl font-bold text-gray-600">{getUnassignedCourses().length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Assignées</div>
            <div className="text-2xl font-bold text-blue-600">
              {courses.filter(c => c.statut === 'ASSIGNEE').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Terminées</div>
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.statut === 'TERMINEE').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}