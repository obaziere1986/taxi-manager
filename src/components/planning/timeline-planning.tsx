"use client"

import { useState } from 'react'
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, User } from 'lucide-react'

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

interface TimelinePlanningProps {
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

// Générer les créneaux horaires de 6h à 23h
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 6; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 23) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }
  return slots
}

const TimeSlot = ({ time, isCurrentTime }: { time: string; isCurrentTime: boolean }) => (
  <div className={`flex items-center justify-end pr-4 py-2 text-sm font-medium border-r ${
    isCurrentTime ? 'bg-red-100 text-red-600' : 'text-muted-foreground'
  }`}>
    {time}
  </div>
)

const CourseTimelineCard = ({ course }: { course: Course }) => {
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
      className={`cursor-move transition-all hover:shadow-md mb-1 ${
        statutColors[course.statut as keyof typeof statutColors] || 'bg-gray-100'
      } ${isDragging ? 'opacity-50 rotate-1 scale-105' : ''}`}
    >
      <CardContent className="p-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {timeString}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {course.statut}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-start text-xs">
              <MapPin className="h-3 w-3 mt-0.5 mr-1 text-green-600" />
              <span className="font-medium truncate">{course.origine}</span>
            </div>
            <div className="flex items-start text-xs">
              <MapPin className="h-3 w-3 mt-0.5 mr-1 text-red-600" />
              <span className="truncate">{course.destination}</span>
            </div>
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate">{course.client.prenom} {course.client.nom}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ChauffeurTimeline = ({ chauffeur, courses }: { chauffeur: Chauffeur; courses: Course[] }) => {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: chauffeur.id,
  })

  const chauffeurCourses = courses.filter(course => 
    course.chauffeur?.id === chauffeur.id
  )

  const statusColors = {
    DISPONIBLE: 'bg-green-500',
    OCCUPE: 'bg-orange-500',
    HORS_SERVICE: 'bg-red-500'
  }

  // Calculer la position des courses selon l'heure
  const getPositionForTime = (dateHeure: string) => {
    const courseTime = new Date(dateHeure)
    const hours = courseTime.getHours()
    const minutes = courseTime.getMinutes()
    
    // Position relative par rapport au début (6h00)
    const totalMinutes = (hours - 6) * 60 + minutes
    const pixelPerMinute = 1.5 // 1.5px par minute
    
    return Math.max(0, totalMinutes * pixelPerMinute)
  }

  const timeSlots = generateTimeSlots()
  const totalHeight = timeSlots.length * 44 // 44px par slot

  return (
    <div className="border-r border-gray-200">
      {/* Header du chauffeur */}
      <div className="p-3 border-b bg-gray-50 sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[chauffeur.statut as keyof typeof statusColors]}`}></div>
          <div>
            <div className="font-medium text-sm">{chauffeur.prenom} {chauffeur.nom}</div>
            <div className="text-xs text-muted-foreground">{chauffeur.vehicule}</div>
          </div>
        </div>
      </div>
      
      {/* Zone de drop pour les courses avec positionnement temporel */}
      <div
        ref={setNodeRef}
        className={`relative transition-all ${
          isOver ? 'bg-blue-50 border-l-4 border-blue-500' : ''
        }`}
        style={{ height: `${totalHeight}px` }}
      >
        {chauffeurCourses.map((course) => (
          <div
            key={course.id}
            className="absolute w-full px-2"
            style={{
              top: `${getPositionForTime(course.dateHeure)}px`,
              zIndex: 5
            }}
          >
            <CourseTimelineCard course={course} />
          </div>
        ))}
      </div>
    </div>
  )
}

const UnassignedColumn = ({ courses }: { courses: Course[] }) => {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: 'unassigned',
  })

  const unassignedCourses = courses.filter(course => !course.chauffeur)
  const timeSlots = generateTimeSlots()
  const totalHeight = timeSlots.length * 44 // 44px par slot, même hauteur que les autres colonnes

  return (
    <div className="border-r border-gray-200">
      <div className="p-3 border-b bg-gray-50 sticky top-0 z-10">
        <div className="font-medium text-sm">Courses en attente</div>
        <div className="text-xs text-muted-foreground">{unassignedCourses.length} course(s)</div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`p-2 transition-all ${
          isOver ? 'bg-gray-50 border-l-4 border-gray-500' : ''
        }`}
        style={{ height: `${totalHeight}px`, overflowY: 'auto' }}
      >
        {unassignedCourses.map((course) => (
          <div key={course.id} className="mb-1">
            <CourseTimelineCard course={course} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimelinePlanning({ courses, chauffeurs, onCourseAssign }: TimelinePlanningProps) {
  const timeSlots = generateTimeSlots()
  const currentTime = new Date()
  const currentTimeString = currentTime.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  // Calculer la position de la ligne d'heure actuelle
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    
    if (hours < 6 || hours > 23) return -1 // Pas d'affichage en dehors des heures
    
    const totalMinutes = (hours - 6) * 60 + minutes
    const pixelPerMinute = 1.5
    
    return totalMinutes * pixelPerMinute + 60 // +60 pour compenser le header
  }

  const currentTimePosition = getCurrentTimePosition()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const courseId = active.id as string
    const targetId = over.id as string
    
    onCourseAssign(courseId, targetId === 'unassigned' ? null : targetId)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative flex bg-white rounded-lg border overflow-hidden">
        {/* Colonne des heures */}
        <div className="w-20 bg-gray-50 border-r">
          <div className="p-3 border-b font-medium text-sm">
            Heures
          </div>
          <div>
            {timeSlots.map((time) => (
              <TimeSlot 
                key={time} 
                time={time} 
                isCurrentTime={Math.abs(
                  new Date(`2000-01-01 ${time}`).getTime() - 
                  new Date(`2000-01-01 ${currentTimeString}`).getTime()
                ) < 30 * 60000} // 30 minutes de tolérance
              />
            ))}
          </div>
        </div>

        {/* Scrollable area pour les chauffeurs */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max relative">
            {/* Colonne courses non assignées */}
            <div className="w-64">
              <UnassignedColumn courses={courses} />
            </div>

            {/* Colonnes chauffeurs */}
            {chauffeurs.map((chauffeur) => (
              <div key={chauffeur.id} className="w-64">
                <ChauffeurTimeline 
                  chauffeur={chauffeur} 
                  courses={courses}
                />
              </div>
            ))}

            {/* Ligne de l'heure actuelle */}
            {currentTimePosition > 0 && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 shadow-sm"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="absolute -left-2 -top-1 bg-red-500 text-white text-xs px-1 rounded">
                  {currentTimeString}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  )
}