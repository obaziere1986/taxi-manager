"use client"

import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, User } from 'lucide-react'
import { getCourseStatusBadge, getDefaultBadge } from '@/lib/badge-utils'

interface CourseCardProps {
  course: {
    id: string
    origine: string
    destination: string
    dateHeure: string
    statut: string
    notes?: string
    client: {
      nom: string
      prenom: string
    }
    chauffeur?: {
      nom: string
      prenom: string
    } | null
    user?: {
      nom: string
      prenom: string
    } | null
  }
}

// Supprimé statutColors - utilise maintenant le système unifié de badge-utils

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
      className={`cursor-move transition-all hover:shadow-md ${isDragging ? 'opacity-50 rotate-3 scale-105' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            (() => {
              const badgeStyle = getDefaultBadge()
              return <Badge variant={badgeStyle.variant} className={`${badgeStyle.className} text-xs`}>
                {new Date(course.dateHeure).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Badge>
            })()
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

          {(course.chauffeur || course.user) ? (
            <div className="text-xs font-medium text-blue-600">
              {course.user ? 
                `${course.user.prenom} ${course.user.nom.toUpperCase()}` :
                `${course.chauffeur?.prenom} ${course.chauffeur?.nom.toUpperCase()}`
              }
            </div>
          ) : (course.notes && course.notes.includes('utilisateur supprimé')) ? (
            <div className="text-xs font-medium text-red-500 italic">
              Utilisateur supprimé
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}