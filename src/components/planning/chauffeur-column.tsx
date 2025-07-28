"use client"

import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CourseCard } from './course-card'
import { Car, Phone } from 'lucide-react'

interface ChauffeurColumnProps {
  chauffeur: {
    id: string
    nom: string
    prenom: string
    telephone: string
    vehicule: string
    statut: string
  }
  courses: any[]
}

const statutColors = {
  DISPONIBLE: 'bg-green-500',
  OCCUPE: 'bg-orange-500',
  HORS_SERVICE: 'bg-red-500'
}

export function ChauffeurColumn({ chauffeur, courses }: ChauffeurColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: chauffeur.id,
  })

  return (
    <Card className={`h-full transition-all ${isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{chauffeur.prenom} {chauffeur.nom.toUpperCase()}</CardTitle>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${statutColors[chauffeur.statut as keyof typeof statutColors]}`}></div>
            <Badge variant="outline" className="text-xs">
              {chauffeur.statut === 'DISPONIBLE' ? 'Disponible' :
               chauffeur.statut === 'OCCUPE' ? 'Occupé' : 'Hors service'}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Car className="h-3 w-3 mr-1" />
            <span>{chauffeur.vehicule}</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-3 w-3 mr-1" />
            <span>{chauffeur.telephone}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent ref={setNodeRef} className="pt-0 space-y-2 min-h-[200px]">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
        
        {courses.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed border-gray-200 rounded">
            Aucune course assignée
          </div>
        )}
      </CardContent>
    </Card>
  )
}