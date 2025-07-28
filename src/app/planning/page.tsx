"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PageHeader } from '@/components/page-header'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, MapPin, Plus, Zap, CheckCircle } from 'lucide-react'
import { format, addDays, subDays, startOfDay, endOfDay, addHours, startOfHour } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'

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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    course?: Course
    chauffeur?: Chauffeur
    hour?: number
  }>({ isOpen: false })
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
        await fetchData() // Recharger les données
      } else {
        const result = await response.json()
        console.error('Assignment failed:', result)
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

  // Générer les créneaux horaires de 7h à 22h
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 7; hour <= 22; hour++) {
      slots.push(hour)
    }
    return slots
  }

  const formatHour = (hour: number) => {
    return `${hour}:00`
  }

  const getCourseForChauffeurAtHour = (chauffeurId: string, hour: number) => {
    const foundCourse = courses.find(course => {
      if (course.chauffeur?.id !== chauffeurId) return false
      const courseDate = new Date(course.dateHeure)
      const courseHour = courseDate.getHours()
      
      // Vérifier que c'est le bon jour ET la bonne heure
      const courseDay = courseDate.toDateString()
      const selectedDay = selectedDate.toDateString()
      
      const isMatch = courseDay === selectedDay && courseHour === hour
      
      // Debug pour comprendre pourquoi les courses n'apparaissent pas
      if (isMatch) {
        console.log(`Course trouvée pour ${chauffeurId} à ${hour}h:`, {
          courseId: course.id,
          courseHour,
          courseDay,
          selectedDay,
          chauffeur: course.chauffeur
        })
      }
      
      return isMatch
    })
    
    return foundCourse
  }

  const isChauffeurAvailable = (chauffeurId: string, hour: number) => {
    // Pour l'instant, on considère qu'un chauffeur est disponible s'il n'a pas de course à cette heure
    // Plus tard, on pourra ajouter une vraie gestion des disponibilités
    return !getCourseForChauffeurAtHour(chauffeurId, hour)
  }

  const formatStatut = (statut: string) => {
    const statutMap: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'ASSIGNEE': 'Assignée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée'
    }
    return statutMap[statut] || statut
  }

  const openAssignDialog = (course: Course, chauffeur: Chauffeur, hour: number) => {
    // Vérifier si le créneau est libre
    if (!isChauffeurAvailable(chauffeur.id, hour)) {
      alert('Ce créneau est déjà occupé')
      return
    }

    setConfirmDialog({
      isOpen: true,
      course,
      chauffeur,
      hour
    })
  }

  const confirmAssignment = async () => {
    const { course, chauffeur, hour } = confirmDialog
    if (!course || !chauffeur || hour === undefined) return

    // Créer la nouvelle date/heure précise
    const selectedDateAtHour = addHours(startOfDay(selectedDate), hour)
    
    try {
      // Mettre à jour la course avec la nouvelle heure ET le chauffeur
      const updateResponse = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origine: course.origine,
          destination: course.destination,
          dateHeure: selectedDateAtHour.toISOString(),
          clientId: course.client?.id || course.clientId,
          chauffeurId: chauffeur.id,
          prix: course.prix,
          notes: course.notes,
          statut: 'ASSIGNEE'
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        console.error('Erreur API:', errorData)
        throw new Error('Erreur lors de l\'assignation')
      }

      // Recharger les données pour voir les changements
      await fetchData()
      
      // Debug : vérifier que la course a bien été mise à jour
      console.log('Course assignée avec succès, rechargement des données...')
      
      // Fermer la modale
      setConfirmDialog({ isOpen: false })
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
      alert('Erreur lors de l\'assignation de la course')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const courseId = active.id as string
    const course = courses.find(c => c.id === courseId)
    if (!course) return

    const dropId = over.id as string
    const [chauffeurId, hourStr] = dropId.split('-')
    const hour = parseInt(hourStr)

    const chauffeur = chauffeurs.find(c => c.id === chauffeurId)
    if (!chauffeur) return

    // Ouvrir la modale de confirmation
    openAssignDialog(course, chauffeur, hour)
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

  // Composant pour les courses draggables
  const DraggableCourse = ({ course }: { course: Course }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: course.id,
    })

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <Card 
        ref={setNodeRef} 
        style={style} 
        {...listeners} 
        {...attributes}
        className="p-3 cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
      >
        <div className="space-y-2">
          <div className="flex items-center text-xs font-medium">
            <Clock className="h-3 w-3 mr-1" />
            {format(new Date(course.dateHeure), 'HH:mm')}
          </div>
          <div className="text-sm font-medium">
            {course.origine} → {course.destination}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            {course.client.prenom} {course.client.nom.toUpperCase()}
          </div>
          <Badge variant="secondary" className="text-xs">
            {formatStatut(course.statut)}
          </Badge>
        </div>
      </Card>
    )
  }

  // Composant pour les slots droppables
  const DroppableSlot = ({ chauffeurId, hour, children }: { 
    chauffeurId: string, 
    hour: number, 
    children: React.ReactNode 
  }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: `${chauffeurId}-${hour}`,
    })

    return (
      <td 
        ref={setNodeRef}
        className={`p-1 border-r text-center transition-colors ${
          isOver ? 'bg-blue-100 border-blue-300' : ''
        }`}
      >
        {children}
      </td>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title="Planning Journalier">
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
      </PageHeader>

      {/* Statistiques du jour - en haut */}
      <div className="flex-shrink-0 p-6 border-b bg-background">
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
              <div className="text-2xl font-bold text-orange-600">{getUnassignedCourses().length}</div>
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

      {/* Planning avec Timeline */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-320px)]">
          
          {/* Panel gauche - Courses non assignées */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Courses en attente ({getUnassignedCourses().length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 h-[calc(100%-80px)] overflow-y-auto">
                {getUnassignedCourses().map((course) => (
                  <DraggableCourse key={course.id} course={course} />
                ))}
                {getUnassignedCourses().length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Toutes les courses sont assignées
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline centrale */}
          <div className="col-span-9">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Planning détaillé
                  </div>
                  <Button size="sm" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Assignation auto
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto h-[calc(100%-80px)]">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th className="sticky left-0 z-20 w-32 p-3 text-left text-xs font-medium text-muted-foreground border-r bg-background">
                          Chauffeur
                        </th>
                        {generateTimeSlots().map((hour) => (
                          <th key={hour} className="w-24 p-2 text-center text-xs font-medium text-muted-foreground border-r">
                            {formatHour(hour)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chauffeurs.map((chauffeur) => (
                        <tr key={chauffeur.id} className="border-b hover:bg-muted/30">
                          <td className="sticky left-0 z-10 p-3 border-r bg-background">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {chauffeur.prenom} {chauffeur.nom.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {chauffeur.vehicule}
                              </div>
                              <Badge 
                                variant={chauffeur.statut === 'DISPONIBLE' ? 'default' : 
                                        chauffeur.statut === 'OCCUPE' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {chauffeur.statut === 'DISPONIBLE' ? 'Disponible' :
                                 chauffeur.statut === 'OCCUPE' ? 'Occupé' : 'Hors service'}
                              </Badge>
                            </div>
                          </td>
                          {generateTimeSlots().map((hour) => {
                            const course = getCourseForChauffeurAtHour(chauffeur.id, hour)
                            const isAvailable = isChauffeurAvailable(chauffeur.id, hour)
                            
                            return (
                              <DroppableSlot key={hour} chauffeurId={chauffeur.id} hour={hour}>
                                {course ? (
                                  <div className="bg-blue-100 border border-blue-300 rounded p-2 text-xs">
                                    <div className="font-medium text-blue-900 truncate">
                                      {course.origine} → {course.destination}
                                    </div>
                                    <div className="text-blue-700 truncate">
                                      {course.client.prenom} {course.client.nom.toUpperCase()}
                                    </div>
                                  </div>
                                ) : isAvailable && chauffeur.statut === 'DISPONIBLE' ? (
                                  <div 
                                    className="h-12 bg-green-50 border border-green-200 rounded hover:bg-green-100 cursor-pointer flex items-center justify-center transition-colors"
                                    onClick={() => {
                                      const unassignedCourses = getUnassignedCourses()
                                      if (unassignedCourses.length > 0) {
                                        // Si une seule course, l'assigner directement avec confirmation
                                        if (unassignedCourses.length === 1) {
                                          openAssignDialog(unassignedCourses[0], chauffeur, hour)
                                        } else {
                                          // TODO: Ouvrir un sélecteur de course si plusieurs courses
                                          openAssignDialog(unassignedCourses[0], chauffeur, hour)
                                        }
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="h-12 bg-gray-50 rounded border border-gray-200"></div>
                                )}
                              </DroppableSlot>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modale de confirmation d'assignation */}
        <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog({ isOpen: open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Confirmer l'assignation
              </DialogTitle>
              <DialogDescription>
                Vous êtes sur le point d'assigner une course à un chauffeur.
              </DialogDescription>
            </DialogHeader>
            {confirmDialog.course && confirmDialog.chauffeur && confirmDialog.hour !== undefined && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium text-sm mb-2">Détails de la course</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatHour(confirmDialog.hour)} le {format(selectedDate, 'dd/MM/yyyy', { locale: fr })}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {confirmDialog.course.origine} → {confirmDialog.course.destination}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {confirmDialog.course.client.prenom} {confirmDialog.course.client.nom.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium text-sm mb-2">Chauffeur assigné</h4>
                  <div className="space-y-1 text-sm">
                    <div>{confirmDialog.chauffeur.prenom} {confirmDialog.chauffeur.nom.toUpperCase()}</div>
                    <div className="text-muted-foreground">{confirmDialog.chauffeur.vehicule}</div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmDialog({ isOpen: false })}
                  >
                    Annuler
                  </Button>
                  <Button onClick={confirmAssignment}>
                    Confirmer l'assignation
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* DragOverlay pour l'aperçu pendant le drag */}
        <DragOverlay>
          {activeId ? (
            <DraggableCourse course={courses.find(c => c.id === activeId)!} />
          ) : null}
        </DragOverlay>
      </div>
    </div>
    </DndContext>
  )
}