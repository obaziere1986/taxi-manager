"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClientCombobox } from '@/components/ui/combobox'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/page-header'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, MapPin, Plus, Zap, CheckCircle, UserPlus, Euro, Edit } from 'lucide-react'
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
  DragOverEvent,
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

interface Client {
  id: string
  nom: string
  prenom: string
  telephone: string
  email?: string
}

export default function PlanningPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [courses, setCourses] = useState<Course[]>([])
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [courseDetailsDialog, setCourseDetailsDialog] = useState<{
    isOpen: boolean
    course?: Course
  }>({ isOpen: false })
  const [editingCourse, setEditingCourse] = useState(false)
  const [editCourseFormData, setEditCourseFormData] = useState({
    origine: '',
    destination: '',
    dateHeure: '',
    prix: '',
    notes: ''
  })
  const [assignmentDialog, setAssignmentDialog] = useState<{
    isOpen: boolean
    course?: Course
  }>({ isOpen: false })
  const [isDragging, setIsDragging] = useState(false)
  const [createCourseDialog, setCreateCourseDialog] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [courseFormData, setCourseFormData] = useState({
    origine: '',
    destination: '',
    dateHeure: '',
    clientId: '',
    prix: '',
    notes: ''
  })
  const [newClientData, setNewClientData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: ''
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum de 8px de mouvement pour déclencher le drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchData()
    fetchClients()
  }, [selectedDate])

  // Auto-scroll vers l'heure actuelle au chargement (seulement pour aujourd'hui)
  useEffect(() => {
    if (isToday() && !loading) {
      const currentHour = getCurrentHour()
      const timeSlots = generateTimeSlots()
      const currentIndex = timeSlots.findIndex(hour => hour === currentHour)
      
      if (currentIndex >= 0) {
        // Scroll vers la colonne de l'heure actuelle avec un léger offset
        setTimeout(() => {
          const headerElement = document.querySelector(`th:nth-child(${currentIndex + 2})`) // +2 car première colonne = chauffeurs
          if (headerElement) {
            headerElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest', 
              inline: 'center' 
            })
          }
        }, 100)
      }
    }
  }, [loading, selectedDate])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
    }
  }

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

      // Vérifier si les réponses sont valides
      if (!Array.isArray(coursesData)) {
        console.error('coursesData n\'est pas un tableau:', coursesData)
        setCourses([])
        setChauffeurs([])
        return
      }

      if (!Array.isArray(chauffeursData)) {
        console.error('chauffeursData n\'est pas un tableau:', chauffeursData)
        setCourses([])
        setChauffeurs([])
        return
      }

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

  // Fonction pour vérifier si c'est le jour actuel
  const isToday = () => {
    const today = new Date()
    return selectedDate.toDateString() === today.toDateString()
  }

  // Fonction pour obtenir l'heure actuelle
  const getCurrentHour = () => {
    return new Date().getHours()
  }

  // Fonction pour déterminer si une course est passée
  const isCourseInPast = (course: Course) => {
    if (!isToday()) return false
    const courseDate = new Date(course.dateHeure)
    const now = new Date()
    return courseDate < now
  }

  // Fonction pour obtenir le statut réel d'une course basé sur l'heure actuelle
  const getRealCourseStatus = (course: Course) => {
    // Si ce n'est pas aujourd'hui, retourner le statut original
    if (!isToday()) return course.statut
    
    const courseDate = new Date(course.dateHeure)
    const now = new Date()
    const courseEndTime = new Date(courseDate.getTime() + (60 * 60 * 1000)) // +1h pour la durée estimée
    
    // Si la course est dans le futur, elle ne peut pas être terminée
    if (courseDate > now) {
      if (course.statut === 'TERMINEE') {
        return course.chauffeur ? 'ASSIGNEE' : 'EN_ATTENTE'
      }
      return course.statut
    }
    
    // Si la course est en cours (dans l'heure actuelle)
    if (courseDate <= now && now <= courseEndTime) {
      if (course.statut === 'ASSIGNEE' || course.statut === 'EN_COURS') {
        return 'EN_COURS'
      }
    }
    
    // Sinon, retourner le statut original
    return course.statut
  }

  // Fonction pour obtenir la couleur d'une course selon son état temporel et statut
  const getCourseColor = (course: Course) => {
    if (isCourseInPast(course)) {
      // Course passée
      if (course.statut === 'TERMINEE') {
        return 'bg-green-100 border-green-300' // Vert pour terminée
      } else if (course.statut === 'ANNULEE') {
        return 'bg-red-100 border-red-300' // Rouge pour annulée
      } else {
        return 'bg-red-100 border-red-300' // Rouge pour les courses passées non terminées
      }
    } else {
      // Course future
      if (course.statut === 'EN_ATTENTE') {
        return 'bg-gray-100 border-gray-300' // Gris pour en attente
      } else {
        return 'bg-blue-100 border-blue-300' // Bleu pour assignées/en cours
      }
    }
  }

  // Fonction pour obtenir tous les chauffeurs avec leurs infos pour une course
  const getAvailableDriversForCourse = (course: Course) => {
    const courseDate = new Date(course.dateHeure)
    const courseHour = courseDate.getHours()
    
    return chauffeurs
      .map(chauffeur => {
        // Obtenir toutes les courses de ce chauffeur pour le jour sélectionné
        const allCoursesForDriver = courses.filter(c => 
          c.chauffeur?.id === chauffeur.id &&
          new Date(c.dateHeure).toDateString() === selectedDate.toDateString()
        )
        
        // Trouver course précédente et suivante par rapport à l'heure de la nouvelle course
        const previousCourse = allCoursesForDriver
          .filter(c => new Date(c.dateHeure) < courseDate && c.id !== course.id)
          .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime())[0]
        
        const nextCourse = allCoursesForDriver
          .filter(c => new Date(c.dateHeure) > courseDate && c.id !== course.id)
          .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())[0]
        
        const isAvailable = isChauffeurAvailable(chauffeur.id, courseHour)
        const isCompatible = isSlotCompatible(course, courseHour)
        const canAssign = chauffeur.statut === 'DISPONIBLE' && isAvailable && isCompatible
        
        return {
          ...chauffeur,
          previousCourse,
          nextCourse,
          isAvailable,
          isCompatible,
          canAssign
        }
      })
      .sort((a, b) => {
        // Tri : assignables en premier, puis par compatibilité, puis par nom
        if (a.canAssign && !b.canAssign) return -1
        if (!a.canAssign && b.canAssign) return 1
        if (a.isCompatible && !b.isCompatible) return -1
        if (!a.isCompatible && b.isCompatible) return 1
        return a.nom.localeCompare(b.nom)
      })
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

  const getCompatibleCourses = (targetHour: number, toleranceMinutes: number = 30) => {
    return getUnassignedCourses().filter(course => {
      const courseDate = new Date(course.dateHeure)
      const courseHour = courseDate.getHours()
      const courseMinutes = courseDate.getMinutes()
      
      // Convertir l'heure de la course en minutes
      const courseTotalMinutes = courseHour * 60 + courseMinutes
      // Convertir l'heure cible en minutes
      const targetTotalMinutes = targetHour * 60
      
      // Vérifier que c'est le bon jour
      const courseDay = courseDate.toDateString()
      const selectedDay = selectedDate.toDateString()
      
      if (courseDay !== selectedDay) return false
      
      // Vérifier si la course est dans la fenêtre de tolérance
      const timeDifference = Math.abs(courseTotalMinutes - targetTotalMinutes)
      return timeDifference <= toleranceMinutes
    })
  }



  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string
    setActiveId(activeId)
    setIsDragging(true)
    
    // Extraire l'ID réel de la course (enlever le préfixe "planning-" si présent)
    let courseId = activeId
    if (activeId.startsWith('planning-')) {
      courseId = activeId.replace('planning-', '')
    }
    
    const course = courses.find(c => c.id === courseId)
    setActiveCourse(course || null)
    
    // Auto-scroll vers l'heure de la course pour les courses non assignées
    if (course && !course.chauffeur) {
      setTimeout(() => {
        const courseDate = new Date(course.dateHeure)
        const courseHour = courseDate.getHours()
        const timeSlots = generateTimeSlots()
        const hourIndex = timeSlots.findIndex(hour => hour === courseHour)
        
        if (hourIndex >= 0) {
          const headerElement = document.querySelector(`th:nth-child(${hourIndex + 2})`) // +2 car première colonne = chauffeurs
          if (headerElement) {
            headerElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest', 
              inline: 'center' 
            })
          }
        }
      }, 100)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setDragOverSlot(over ? over.id as string : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveCourse(null)
    setDragOverSlot(null)
    setIsDragging(false)

    if (!over) return

    const activeId = active.id as string
    let courseId = activeId
    
    // Si c'est une course du planning, retirer le préfixe
    if (activeId.startsWith('planning-')) {
      courseId = activeId.replace('planning-', '')
    }
    
    const course = courses.find(c => c.id === courseId)
    if (!course) return

    const dropId = over.id as string
    
    // Si on drop vers "unassigned", désassigner la course
    if (dropId === 'unassigned') {
      handleCourseAssign(courseId, null)
      return
    }
    
    const [chauffeurId, hourStr] = dropId.split('-')
    const hour = parseInt(hourStr)

    const chauffeur = chauffeurs.find(c => c.id === chauffeurId)
    if (!chauffeur) return

    // Si la course n'est pas assignée, assigner directement
    if (!course.chauffeur) {
      handleCourseAssign(courseId, chauffeurId)
      return
    }

    // Si la course est déjà assignée à un autre chauffeur, demander confirmation
    if (course.chauffeur.id !== chauffeurId) {
      if (confirm(`Êtes-vous sûr de vouloir réassigner cette course à ${chauffeur.nom.toUpperCase()}, ${chauffeur.prenom} ?`)) {
        handleCourseAssign(courseId, chauffeurId)
      }
      return
    }

    // Si on drop sur le même chauffeur, ne rien faire
  }

  const resetCourseForm = () => {
    setCourseFormData({
      origine: '',
      destination: '',
      dateHeure: format(selectedDate, 'yyyy-MM-dd\'T\'HH:mm'),
      clientId: '',
      prix: '',
      notes: ''
    })
    setNewClientData({
      nom: '',
      prenom: '',
      telephone: '',
      email: ''
    })
    setShowNewClientForm(false)
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let clientId = courseFormData.clientId

      // Si on crée un nouveau client
      if (showNewClientForm) {
        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newClientData),
        })

        if (!clientResponse.ok) {
          throw new Error('Erreur lors de la création du client')
        }

        const newClient = await clientResponse.json()
        clientId = newClient.id
        
        // Recharger la liste des clients
        await fetchClients()
      }

      // Créer la course
      const courseResponse = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...courseFormData,
          clientId,
          prix: courseFormData.prix ? parseFloat(courseFormData.prix) : null,
        }),
      })

      if (!courseResponse.ok) {
        throw new Error('Erreur lors de la création de la course')
      }

      // Recharger les données et fermer la modale
      await fetchData()
      setCreateCourseDialog(false)
      resetCourseForm()
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      alert('Erreur lors de la création de la course')
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

  // Composant pour les courses draggables (colonne en attente)
  const DraggableCourse = ({ course }: { course: Course }) => {
    const [isClicking, setIsClicking] = useState(false)
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: course.id,
      disabled: isClicking, // Désactiver le drag pendant le clic
    })

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <Card 
        ref={setNodeRef} 
        style={style} 
        {...(isClicking ? {} : listeners)}
        {...(isClicking ? {} : attributes)}
        className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-gray-100 border border-gray-300"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsClicking(true)
          // Si la course n'est pas assignée, ouvrir la modal d'assignation
          if (!course.chauffeur || course.statut === 'EN_ATTENTE') {
            setAssignmentDialog({ isOpen: true, course })
          } else {
            setCourseDetailsDialog({ isOpen: true, course })
          }
          // Reset après un délai
          setTimeout(() => setIsClicking(false), 100)
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center text-xs font-medium">
            <Clock className="h-3 w-3 mr-1" />
            {format(new Date(course.dateHeure), 'HH:mm', { locale: fr })}
          </div>
          <div className="text-sm font-medium">
            {course.origine} → {course.destination}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            {course.client.nom.toUpperCase()}, {course.client.prenom}
          </div>
          <Badge 
            variant="secondary" 
            className={`text-xs ${
              getRealCourseStatus(course) === 'TERMINEE' ? 'bg-green-500 text-white hover:bg-green-600' :
              getRealCourseStatus(course) === 'ANNULEE' ? 'bg-red-500 text-white hover:bg-red-600' :
              getRealCourseStatus(course) === 'EN_COURS' ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse' :
              'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {formatStatut(getRealCourseStatus(course))}
          </Badge>
        </div>
      </Card>
    )
  }

  // Composant pour les courses dans le planning (draggables également)
  const PlanningCourse = ({ course }: { course: Course }) => {
    const [isClicking, setIsClicking] = useState(false)
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: `planning-${course.id}`, // Préfixe pour différencier
      disabled: isClicking, // Désactiver le drag si on clique
    })

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
    }

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsClicking(true)
      // Toujours ouvrir les détails pour les courses dans le planning
      setCourseDetailsDialog({ isOpen: true, course })
      setTimeout(() => setIsClicking(false), 100)
    }

    return (
      <div 
        ref={setNodeRef}
        style={style}
        {...(isClicking ? {} : listeners)} 
        {...(isClicking ? {} : attributes)}
        className="bg-gray-100 border border-gray-300 rounded p-2 text-xs cursor-pointer hover:opacity-80 transition-colors w-full overflow-hidden"
        onClick={handleClick}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="font-medium text-blue-900 text-xs">
            {format(new Date(course.dateHeure), 'HH:mm', { locale: fr })}
          </div>
          <Badge 
            variant="secondary" 
            className={`text-xs ${
              getRealCourseStatus(course) === 'TERMINEE' ? 'bg-green-500 text-white hover:bg-green-600' :
              getRealCourseStatus(course) === 'ANNULEE' ? 'bg-red-500 text-white hover:bg-red-600' :
              getRealCourseStatus(course) === 'EN_COURS' ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse' :
              'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {formatStatut(getRealCourseStatus(course))}
          </Badge>
        </div>
        <div className="font-medium text-blue-900 truncate text-xs">
          {course.origine} → {course.destination}
        </div>
        <div className="text-blue-700 truncate text-xs">
          {course.client.nom.toUpperCase()}, {course.client.prenom}
        </div>
      </div>
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

    const slotId = `${chauffeurId}-${hour}`
    const isAvailable = isChauffeurAvailable(chauffeurId, hour)
    const isCompatible = activeCourse && isSlotCompatible(activeCourse, hour)
    const chauffeur = chauffeurs.find(c => c.id === chauffeurId)
    const isChauffeurAvailableForDrag = chauffeur?.statut === 'DISPONIBLE'
    
    // Logique de coloration pendant le drag
    let slotClass = 'p-0 border-r text-center transition-colors w-36 min-w-[140px] max-w-[140px] relative'
    
    if (activeCourse) {
      if (isOver) {
        if (isCompatible && isAvailable && isChauffeurAvailableForDrag) {
          slotClass += ' bg-green-100 border-green-300 ring-2 ring-green-300'
        } else {
          slotClass += ' bg-red-100 border-red-300 ring-2 ring-red-300'
        }
      } else {
        if (isCompatible && isAvailable && isChauffeurAvailableForDrag) {
          slotClass += ' bg-green-50 border-green-200'
        } else {
          slotClass += ' bg-gray-200 opacity-50'
        }
      }
    }

    return (
      <td className={slotClass}>
        <div 
          ref={setNodeRef}
          className="w-full h-full min-h-[48px] flex items-center justify-center"
        >
          {children}
        </div>
      </td>
    )
  }

  // Fonction pour vérifier si un slot est compatible avec une course
  const isSlotCompatible = (course: Course, hour: number) => {
    const courseDate = new Date(course.dateHeure)
    const courseHour = courseDate.getHours()
    
    // Tolérance de 30 minutes
    const timeDifference = Math.abs(courseHour - hour)
    return timeDifference <= 0.5
  }

  // Composant pour la zone de drop des courses non assignées
  const UnassignedDropZone = ({ children }: { children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: 'unassigned',
    })

    return (
      <div 
        ref={setNodeRef}
        className={`space-y-3 p-6 flex-1 overflow-y-auto transition-colors ${
          isOver ? 'bg-gray-100' : ''
        }`}
      >
        {children}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className={`grid gap-6 flex-1 min-h-0 ${
          getUnassignedCourses().length > 0 ? 'grid-cols-12' : 'grid-cols-1'
        }`}>
          
          {/* Panel gauche - Courses non assignées */}
          {getUnassignedCourses().length > 0 && (
          <div className="col-span-3 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Courses en attente ({getUnassignedCourses().length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                <UnassignedDropZone>
                {getUnassignedCourses()
                  .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
                  .map((course) => (
                    <DraggableCourse key={course.id} course={course} />
                  ))}
                  {getUnassignedCourses().length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Toutes les courses sont assignées
                    </div>
                  )}
                </UnassignedDropZone>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Timeline centrale */}
          <div className={`flex flex-col min-h-0 ${
            getUnassignedCourses().length > 0 ? 'col-span-9' : 'col-span-1'
          }`}>
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Planning détaillé
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        resetCourseForm()
                        setCreateCourseDialog(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle course
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                <div className="flex-1 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th 
                          className="sticky left-0 z-20 w-32 p-3 text-left text-xs font-medium text-muted-foreground border-r bg-background"
                          style={{ boxShadow: '2px 0 4px -1px rgba(0, 0, 0, 0.1)' }}
                        >
                          Chauffeur
                        </th>
                        {generateTimeSlots().map((hour) => (
                          <th key={hour} className={`w-36 min-w-[140px] max-w-[140px] p-2 text-center text-xs font-medium border-r ${
                            isToday() && hour === getCurrentHour() 
                              ? 'bg-blue-100 text-blue-600 font-bold' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatHour(hour)}
                            {isToday() && hour === getCurrentHour() && (
                              <div className="text-xs mt-1 text-blue-500">MAINTENANT</div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chauffeurs
                        .sort((a, b) => {
                          // Tri par statut : DISPONIBLE en premier, puis OCCUPE, puis HORS_SERVICE
                          const statutOrder = { 'DISPONIBLE': 0, 'OCCUPE': 1, 'HORS_SERVICE': 2 }
                          const aOrder = statutOrder[a.statut as keyof typeof statutOrder] ?? 3
                          const bOrder = statutOrder[b.statut as keyof typeof statutOrder] ?? 3
                          if (aOrder !== bOrder) return aOrder - bOrder
                          
                          // Si même statut, tri alphabétique par nom
                          return a.nom.localeCompare(b.nom)
                        })
                        .map((chauffeur) => (
                        <tr key={chauffeur.id} className="border-b hover:bg-muted/30">
                          <td 
                            className="sticky left-0 z-10 p-3 border-r bg-background"
                            style={{ boxShadow: '2px 0 4px -1px rgba(0, 0, 0, 0.1)' }}
                          >
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {chauffeur.nom.toUpperCase()}, {chauffeur.prenom}
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
                            const isCurrentHour = isToday() && hour === getCurrentHour()
                            
                            return (
                              <DroppableSlot key={hour} chauffeurId={chauffeur.id} hour={hour}>
                                <div className={`${isCurrentHour ? 'bg-blue-50' : ''} w-full h-full p-1`}>
                                {course ? (
                                  <PlanningCourse course={course} />
                                ) : (
                                  <div className="h-12 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">-</span>
                                  </div>
                                )}
                                </div>
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


        {/* Modale de création de course */}
        <Dialog open={createCourseDialog} onOpenChange={(open) => {
          setCreateCourseDialog(open)
          if (!open) resetCourseForm()
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nouvelle course</DialogTitle>
              <DialogDescription>
                Créer une nouvelle course pour le {format(selectedDate, 'dd/MM/yyyy', { locale: fr })}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              {/* Date et heure */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateHeure">Date et heure *</Label>
                  <Input
                    id="dateHeure"
                    type="datetime-local"
                    value={courseFormData.dateHeure}
                    onChange={(e) => setCourseFormData({ ...courseFormData, dateHeure: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix estimé (€)</Label>
                  <Input
                    id="prix"
                    type="number"
                    step="0.01"
                    value={courseFormData.prix}
                    onChange={(e) => setCourseFormData({ ...courseFormData, prix: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Origine et destination */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origine">Origine *</Label>
                  <Input
                    id="origine"
                    value={courseFormData.origine}
                    onChange={(e) => setCourseFormData({ ...courseFormData, origine: e.target.value })}
                    placeholder="Adresse de départ"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    value={courseFormData.destination}
                    onChange={(e) => setCourseFormData({ ...courseFormData, destination: e.target.value })}
                    placeholder="Adresse d'arrivée"
                    required
                  />
                </div>
              </div>

              {/* Client */}
              <div className="space-y-2">
                <Label>Client *</Label>
                {!showNewClientForm ? (
                  <div className="flex gap-2">
                    <ClientCombobox
                      clients={clients}
                      value={courseFormData.clientId}
                      onValueChange={(value) => setCourseFormData({ ...courseFormData, clientId: value })}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewClientForm(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nouveau
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Nouveau client</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewClientForm(false)}
                      >
                        Annuler
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="clientNom">Nom *</Label>
                        <Input
                          id="clientNom"
                          value={newClientData.nom}
                          onChange={(e) => setNewClientData({ ...newClientData, nom: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientPrenom">Prénom *</Label>
                        <Input
                          id="clientPrenom"
                          value={newClientData.prenom}
                          onChange={(e) => setNewClientData({ ...newClientData, prenom: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientTelephone">Téléphone *</Label>
                        <Input
                          id="clientTelephone"
                          type="tel"
                          value={newClientData.telephone}
                          onChange={(e) => setNewClientData({ ...newClientData, telephone: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          value={newClientData.email}
                          onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={courseFormData.notes}
                  onChange={(e) => setCourseFormData({ ...courseFormData, notes: e.target.value })}
                  placeholder="Informations complémentaires..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateCourseDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Créer la course
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modale des détails de course */}
        <Dialog open={courseDetailsDialog.isOpen} onOpenChange={(open) => setCourseDetailsDialog({ isOpen: open })}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Détails de la course
              </DialogTitle>
              <DialogDescription>
                Informations complètes sur la course sélectionnée.
              </DialogDescription>
            </DialogHeader>
            {courseDetailsDialog.course && (
              <div className="space-y-4">
                {!editingCourse ? (
                  // Vue lecture seule
                  <>
                    {/* Informations principales */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">Date et heure</div>
                        <div className="text-sm">
                          {format(new Date(courseDetailsDialog.course.dateHeure), 'EEEE d MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {format(new Date(courseDetailsDialog.course.dateHeure), 'HH:mm', { locale: fr })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">Statut</div>
                        <Badge variant={
                          courseDetailsDialog.course.statut === 'EN_ATTENTE' ? 'secondary' :
                          courseDetailsDialog.course.statut === 'ASSIGNEE' ? 'default' :
                          courseDetailsDialog.course.statut === 'EN_COURS' ? 'secondary' :
                          courseDetailsDialog.course.statut === 'TERMINEE' ? 'default' : 'destructive'
                        }>
                          {formatStatut(courseDetailsDialog.course.statut)}
                        </Badge>
                      </div>
                    </div>

                    {/* Trajet */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium text-sm mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Trajet
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <div className="w-3 h-3 rounded-full bg-green-500 mt-1 mr-3 flex-shrink-0"></div>
                          <div>
                            <div className="text-sm font-medium">Origine</div>
                            <div className="text-sm text-muted-foreground">
                              {courseDetailsDialog.course.origine}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="w-3 h-3 rounded-full bg-red-500 mt-1 mr-3 flex-shrink-0"></div>
                          <div>
                            <div className="text-sm font-medium">Destination</div>
                            <div className="text-sm text-muted-foreground">
                              {courseDetailsDialog.course.destination}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Client */}
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-sm mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Client
                      </h4>
                      <div className="text-sm">
                        {courseDetailsDialog.course.client.nom.toUpperCase()}, {courseDetailsDialog.course.client.prenom}
                      </div>
                    </div>

                    {/* Prix et notes */}
                    {(courseDetailsDialog.course.prix || courseDetailsDialog.course.notes) && (
                      <div className="grid grid-cols-2 gap-4">
                        {courseDetailsDialog.course.prix && (
                          <div className="border rounded-lg p-4 bg-yellow-50">
                            <h4 className="font-medium text-sm mb-2 flex items-center">
                              <Euro className="h-4 w-4 mr-2" />
                              Prix
                            </h4>
                            <div className="text-sm font-semibold">
                              {courseDetailsDialog.course.prix}€
                            </div>
                          </div>
                        )}
                        {courseDetailsDialog.course.notes && (
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-medium text-sm mb-2">Notes</h4>
                            <div className="text-sm text-muted-foreground">
                              {courseDetailsDialog.course.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chauffeur assigné */}
                    {courseDetailsDialog.course.chauffeur && (
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Chauffeur assigné
                        </h4>
                        <div className="text-sm">
                          {courseDetailsDialog.course.chauffeur.nom.toUpperCase()}, {courseDetailsDialog.course.chauffeur.prenom}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Vue édition
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    try {
                      const response = await fetch(`/api/courses/${courseDetailsDialog.course!.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          origine: editCourseFormData.origine,
                          destination: editCourseFormData.destination,
                          dateHeure: new Date(editCourseFormData.dateHeure).toISOString(),
                          prix: editCourseFormData.prix ? parseFloat(editCourseFormData.prix) : null,
                          notes: editCourseFormData.notes || null,
                        }),
                      })

                      if (response.ok) {
                        await fetchData() // Recharger les données
                        setEditingCourse(false)
                        setCourseDetailsDialog({ isOpen: false })
                      } else {
                        alert('Erreur lors de la modification de la course')
                      }
                    } catch (error) {
                      console.error('Erreur lors de la modification:', error)
                      alert('Erreur lors de la modification de la course')
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editDateHeure">Date et heure</Label>
                      <Input
                        id="editDateHeure"
                        type="datetime-local"
                        value={editCourseFormData.dateHeure}
                        onChange={(e) => setEditCourseFormData({ ...editCourseFormData, dateHeure: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editOrigine">Origine</Label>
                        <Input
                          id="editOrigine"
                          value={editCourseFormData.origine}
                          onChange={(e) => setEditCourseFormData({ ...editCourseFormData, origine: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDestination">Destination</Label>
                        <Input
                          id="editDestination"
                          value={editCourseFormData.destination}
                          onChange={(e) => setEditCourseFormData({ ...editCourseFormData, destination: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editPrix">Prix (€)</Label>
                        <Input
                          id="editPrix"
                          type="number"
                          step="0.01"
                          value={editCourseFormData.prix}
                          onChange={(e) => setEditCourseFormData({ ...editCourseFormData, prix: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editNotes">Notes</Label>
                      <Textarea
                        id="editNotes"
                        value={editCourseFormData.notes}
                        onChange={(e) => setEditCourseFormData({ ...editCourseFormData, notes: e.target.value })}
                        placeholder="Informations complémentaires..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setEditingCourse(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        Sauvegarder
                      </Button>
                    </div>
                  </form>
                )}

                {!editingCourse && (
                  <div className="flex justify-between pt-4">
                    <div className="space-x-2">
                      {courseDetailsDialog.course.chauffeur && (
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            await handleCourseAssign(courseDetailsDialog.course!.id, null)
                            setCourseDetailsDialog({ isOpen: false })
                          }}
                        >
                          Désassigner
                        </Button>
                      )}
                      {courseDetailsDialog.course.statut === 'EN_ATTENTE' && (
                        <Button 
                          onClick={() => {
                            setCourseDetailsDialog({ isOpen: false })
                            setAssignmentDialog({ isOpen: true, course: courseDetailsDialog.course })
                          }}
                        >
                          Assigner
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setEditCourseFormData({
                            origine: courseDetailsDialog.course!.origine,
                            destination: courseDetailsDialog.course!.destination,
                            dateHeure: format(new Date(courseDetailsDialog.course!.dateHeure), "yyyy-MM-dd'T'HH:mm"),
                            prix: courseDetailsDialog.course!.prix?.toString() || '',
                            notes: courseDetailsDialog.course!.notes || ''
                          })
                          setEditingCourse(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCourseDetailsDialog({ isOpen: false })
                        setEditingCourse(false)
                      }}
                    >
                      Fermer
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modale d'assignation pour courses en attente */}
        <Dialog open={assignmentDialog.isOpen} onOpenChange={(open) => setAssignmentDialog({ isOpen: open })}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Assigner une course
              </DialogTitle>
              <DialogDescription>
                Sélectionnez un chauffeur pour cette course en attente.
              </DialogDescription>
            </DialogHeader>
            {assignmentDialog.course && (
              <div className="space-y-4">
                {/* Détails de la course */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-sm mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Course à assigner
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">
                        {format(new Date(assignmentDialog.course.dateHeure), 'HH:mm', { locale: fr })}
                        {' - '}
                        {format(new Date(assignmentDialog.course.dateHeure), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {assignmentDialog.course.origine} → {assignmentDialog.course.destination}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Client</div>
                      <div className="text-sm text-muted-foreground">
                        {assignmentDialog.course.client.nom.toUpperCase()}, {assignmentDialog.course.client.prenom}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des chauffeurs disponibles */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Tous les chauffeurs</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getAvailableDriversForCourse(assignmentDialog.course).map((driver) => (
                      <div
                        key={driver.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          driver.canAssign
                            ? 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer'
                            : driver.statut !== 'DISPONIBLE'
                            ? 'bg-red-50 border-red-200 opacity-75'
                            : 'bg-gray-50 border-gray-200 opacity-75'
                        }`}
                        onClick={() => {
                          if (driver.canAssign) {
                            handleCourseAssign(assignmentDialog.course!.id, driver.id)
                            setAssignmentDialog({ isOpen: false })
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="font-medium text-sm">
                                {driver.prenom} {driver.nom.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {driver.vehicule}
                              </div>
                              {driver.canAssign && (
                                <Badge variant="default" className="text-xs">
                                  Disponible
                                </Badge>
                              )}
                              {driver.statut !== 'DISPONIBLE' && (
                                <Badge variant="destructive" className="text-xs">
                                  {driver.statut === 'OCCUPE' ? 'Occupé' : 'Hors service'}
                                </Badge>
                              )}
                              {driver.statut === 'DISPONIBLE' && !driver.isAvailable && (
                                <Badge variant="secondary" className="text-xs">
                                  Créneau occupé
                                </Badge>
                              )}
                              {driver.statut === 'DISPONIBLE' && driver.isAvailable && !driver.isCompatible && (
                                <Badge variant="outline" className="text-xs">
                                  Horaire incompatible
                                </Badge>
                              )}
                            </div>
                            
                            {/* Planning du chauffeur */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-medium text-muted-foreground">Précédente</div>
                                {driver.previousCourse ? (
                                  <div className="bg-blue-100 rounded p-1 mt-1">
                                    <div className="font-medium">
                                      {format(new Date(driver.previousCourse.dateHeure), 'HH:mm')}
                                    </div>
                                    <div className="truncate">
                                      {driver.previousCourse.origine.slice(0, 15)}...
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground mt-1">Aucune</div>
                                )}
                              </div>
                              
                              <div className="text-center">
                                <div className="font-medium text-muted-foreground">Actuelle</div>
                                <div className="bg-yellow-100 rounded p-1 mt-1">
                                  <div className="font-medium">
                                    {assignmentDialog.course && format(new Date(assignmentDialog.course.dateHeure), 'HH:mm')}
                                  </div>
                                  <div className="truncate">NOUVELLE</div>
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="font-medium text-muted-foreground">Suivante</div>
                                {driver.nextCourse ? (
                                  <div className="bg-blue-100 rounded p-1 mt-1">
                                    <div className="font-medium">
                                      {format(new Date(driver.nextCourse.dateHeure), 'HH:mm')}
                                    </div>
                                    <div className="truncate">
                                      {driver.nextCourse.origine.slice(0, 15)}...
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground mt-1">Aucune</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {getAvailableDriversForCourse(assignmentDialog.course).length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        Aucun chauffeur trouvé
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setAssignmentDialog({ isOpen: false })}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* DragOverlay pour l'aperçu pendant le drag */}
        <DragOverlay
          style={{
            transformOrigin: '50% 50%',
          }}
          modifiers={[
            (args) => ({
              ...args,
              transform: {
                ...args.transform,
                // Center the drag preview by offsetting it
                x: args.transform.x - 75, // Half width of typical card
                y: args.transform.y - 40, // Half height of typical card
              },
            })
          ]}
        >
          {activeId && activeCourse ? (
            <DraggableCourse course={activeCourse} />
          ) : null}
        </DragOverlay>
      </div>
    </div>
    </DndContext>
  )
}