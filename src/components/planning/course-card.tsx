"use client"

import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, User } from 'lucide-react'

interface CourseCardProps {
  course: {
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
    } | null
  }
}

const statutColors = {
  EN_ATTENTE: 'bg-gray-100 border-gray-300',
  ASSIGNEE: 'bg-blue-100 border-blue-300',
  EN_COURS: 'bg-orange-100 border-orange-300',
  TERMINEE: 'bg-green-100 border-green-300',
  ANNULEE: 'bg-red-100 border-red-300'
}

export function CourseCard({ course }: CourseCardProps) {
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-move transition-all hover:shadow-md ${
        statutColors[course.statut as keyof typeof statutColors] || 'bg-gray-100'
      } ${isDragging ? 'opacity-50 rotate-3 scale-105' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {new Date(course.dateHeure).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
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
            <span className="truncate">{course.client.prenom} {course.client.nom.toUpperCase()}</span>
          </div>

          {course.chauffeur && (
            <div className="text-xs font-medium text-blue-600">
              {course.chauffeur.prenom} {course.chauffeur.nom.toUpperCase()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}