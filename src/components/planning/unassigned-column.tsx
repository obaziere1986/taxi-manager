"use client"

import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CourseCard } from './course-card'
import { Calendar } from 'lucide-react'

interface UnassignedColumnProps {
  courses: any[]
}

export function UnassignedColumn({ courses }: UnassignedColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: 'unassigned',
  })

  return (
    <Card className={`h-full transition-all ${isOver ? 'ring-2 ring-gray-500 bg-gray-50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Courses en attente ({courses.length})
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="space-y-2 min-h-[400px]">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
        
        {courses.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed border-gray-200 rounded">
            Toutes les courses sont assignées
          </div>
        )}
      </CardContent>
    </Card>
  )
}