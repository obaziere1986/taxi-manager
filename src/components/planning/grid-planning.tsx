"use client"

import React from 'react'
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDefaultBadge } from '@/lib/badge-utils'
import { MapPin, User, Clock } from 'lucide-react'

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

interface GridPlanningProps {
  courses: Course[]
  chauffeurs: Chauffeur[]
  onCourseAssign: (courseId: string, chauffeurId: string | null) => void
}

const statutColors = {
  EN_ATTENTE: 'bg-gray-100 border-gray-300',
  ASSIGNEE: 'bg-blue-100 border-blue-300', 
  EN_COURS: 'bg-orange-100 border-orange-300',
  TERMINEE: 'bg-green-100 border-green-300',
  ANNULEE: 'bg-red-100 border-red-300'
}

// Générer les créneaux horaires de 6h à 23h (par heure)
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 6; hour <= 23; hour++) {
    slots.push(hour)
  }
  return slots
}

const CourseCard = ({ course }: { course: Course }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: course.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const courseTime = new Date(course.dateHeure)
  const timeString = courseTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-move transition-all hover:shadow-md text-xs ${
        statutColors[course.statut as keyof typeof statutColors] || 'bg-gray-100'
      } ${isDragging ? 'opacity-50 rotate-1 scale-105 z-50' : ''}`}
    >
      <CardContent className="p-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            (() => {
              const badgeStyle = getDefaultBadge()
              return <Badge variant={badgeStyle.variant} className={`${badgeStyle.className} text-xs`}>
                {timeString}
              </Badge>
            })()
            <Badge variant="secondary" className="text-xs">
              {course.statut}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-start text-xs">
              <MapPin className="h-3 w-3 mt-0.5 mr-1 text-green-600 flex-shrink-0" />
              <span className="font-medium truncate">{course.origine}</span>
            </div>
            <div className="flex items-start text-xs">
              <MapPin className="h-3 w-3 mt-0.5 mr-1 text-red-600 flex-shrink-0" />
              <span className="truncate">{course.destination}</span>
            </div>
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{course.client.prenom} {course.client.nom.toUpperCase()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const TimeCell = ({ hour, chauffeurId, courses, isUnassigned = false }: { 
  hour: number, 
  chauffeurId?: string, 
  courses: Course[], 
  isUnassigned?: boolean 
}) => {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: isUnassigned ? `unassigned-${hour}` : `${chauffeurId}-${hour}`,
  })

  // Filtrer les courses pour cette cellule
  const cellCourses = courses.filter(course => {
    const courseDate = new Date(course.dateHeure)
    const courseHour = courseDate.getHours()
    
    if (isUnassigned) {
      return !course.chauffeur && courseHour === hour
    } else {
      return course.chauffeur?.id === chauffeurId && courseHour === hour
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-2 border border-gray-200 transition-all ${
        isOver ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="space-y-2">
        {cellCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}

export function GridPlanning({ courses, chauffeurs, onCourseAssign }: GridPlanningProps) {
  const timeSlots = generateTimeSlots()
  const currentHour = new Date().getHours()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const courseId = active.id as string
    const dropId = over.id as string
    
    // Parser l'ID de drop pour extraire le chauffeur et l'heure
    if (dropId.startsWith('unassigned-')) {
      onCourseAssign(courseId, null)
    } else {
      const [chauffeurId] = dropId.split('-')
      onCourseAssign(courseId, chauffeurId)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full overflow-auto">
        {/* Header avec les chauffeurs */}
        <div className="grid gap-0 border border-gray-300 bg-white" style={{
          gridTemplateColumns: `100px repeat(${chauffeurs.length}, minmax(200px, 1fr)) 200px`
        }}>
          {/* Header Heures */}
          <div className="bg-gray-100 p-3 border-r border-gray-300 font-medium text-center">
            Heures
          </div>
          
          {/* Headers Chauffeurs */}
          {chauffeurs.map((chauffeur) => (
            <div key={chauffeur.id} className="bg-gray-100 p-3 border-r border-gray-300 text-center">
              <div className="font-medium text-sm">{chauffeur.prenom} {chauffeur.nom.toUpperCase()}</div>
              <div className="text-xs text-muted-foreground">{chauffeur.vehicule}</div>
              <div className="flex justify-center mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  chauffeur.statut === 'DISPONIBLE' ? 'bg-green-500' : 
                  chauffeur.statut === 'OCCUPE' ? 'bg-orange-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
          ))}
          
          {/* Header Non assigné */}
          <div className="bg-gray-100 p-3 border-r border-gray-300 text-center font-medium">
            <div>Non assigné</div>
            <div className="text-xs text-muted-foreground">
              {courses.filter(c => !c.chauffeur).length} course(s)
            </div>
          </div>

          {/* Lignes pour chaque heure */}
          {timeSlots.map((hour) => (
            <React.Fragment key={hour}>
              {/* Colonne heure */}
              <div className={`p-3 border-r border-t border-gray-300 text-center font-medium ${
                hour === currentHour ? 'bg-red-50 text-red-600' : 'bg-gray-50'
              }`}>
                {hour.toString().padStart(2, '0')}:00
              </div>
              
              {/* Cellules pour chaque chauffeur */}
              {chauffeurs.map((chauffeur) => (
                <TimeCell
                  key={`${chauffeur.id}-${hour}`}
                  hour={hour}
                  chauffeurId={chauffeur.id}
                  courses={courses}
                />
              ))}
              
              {/* Cellule non assigné */}
              <TimeCell
                key={`unassigned-${hour}`}
                hour={hour}
                courses={courses}
                isUnassigned={true}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </DndContext>
  )
}