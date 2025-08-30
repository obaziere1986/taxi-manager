"use client"

import { useState, useEffect } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { ClientCombobox } from '@/components/ui/combobox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from '@/components/page-header'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, MapPin, Plus, Zap, CheckCircle, UserPlus, Euro, Edit } from 'lucide-react'
import { format, addDays, subDays, startOfDay, endOfDay, addHours, startOfHour } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getCourseStatusBadge, formatStatut, getDefaultBadge } from '@/lib/badge-utils'
import { CourseModal } from '@/components/courses/CourseModal'
import { useSettings } from '@/hooks/useSettings'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  getClientRect,
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
  user?: {
    nom: string
    prenom: string
    id: string
    role: string
  } | null
}

interface User {
  id: string
  nom: string
  prenom: string
  telephone: string
  vehicule: string
  statut: string
  role: string
}

interface Client {
  id: string
  nom: string
  prenom: string
  telephone: string
  email?: string
}

// Composant de planning vertical pour les chauffeurs
function ChauffeurVerticalPlanning({ 
  courses, 
  selectedDate, 
  session, 
  onCourseClick 
}: {
  courses: Course[]
  selectedDate: Date
  session: any
  onCourseClick: (course: Course) => void
}) {
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

  const isToday = () => {
    const today = new Date()
    return selectedDate.toDateString() === today.toDateString()
  }

  const getCurrentHour = () => {
    return new Date().getHours()
  }


  // Filtrer les courses pour la date sélectionnée et le chauffeur connecté
  const dayStart = new Date(selectedDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(selectedDate)
  dayEnd.setHours(23, 59, 59, 999)

  const chauffeurCourses = courses.filter((course: Course) => {
    const courseDate = new Date(course.dateHeure)
    return courseDate >= dayStart && courseDate <= dayEnd && course.user?.id === session?.user?.id
  }).sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())

  return (
    <div className="flex-1 flex flex-col min-h-0 max-h-full">
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mon planning du {format(selectedDate, 'dd/MM/yyyy', { locale: fr })}
          </CardTitle>
          <CardDescription>
            {chauffeurCourses.length} course{chauffeurCourses.length > 1 ? 's' : ''} aujourd'hui
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0 p-4">
          <div className="space-y-3">
        {chauffeurCourses.length > 0 ? (
          chauffeurCourses.map((course) => (
            <div
              key={course.id}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all bg-card border-border"
              onClick={() => onCourseClick(course)}
            >
              <div className="space-y-3">
                {/* Heure et statut */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-bold text-lg">
                      {format(new Date(course.dateHeure), 'HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <Badge 
                    variant={getCourseStatusBadge(course.statut).variant}
                    className={getCourseStatusBadge(course.statut).className}
                  >
                    {formatStatut(course.statut)}
                  </Badge>
                </div>

                {/* Trajet */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium">{course.origine}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-0.5 h-4 bg-gray-300"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-medium">{course.destination}</span>
                  </div>
                </div>

                {/* Client */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{course.client.nom.toUpperCase()}, {course.client.prenom}</span>
                </div>

                {/* Prix et notes */}
                {(course.prix || course.notes) && (
                  <div className="flex items-center justify-between text-sm border-t pt-2">
                    {course.prix && (
                      <div className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        <span className="font-medium">{course.prix}€</span>
                      </div>
                    )}
                    {course.notes && (
                      <span className="text-muted-foreground italic">{course.notes}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">Aucune course aujourd'hui</h3>
            <p className="text-sm">Vous n'avez pas de course assignée pour cette date</p>
          </div>
        )}

          {/* Indication de l'heure actuelle si c'est aujourd'hui */}
          {isToday() && (
            <div className="flex items-center gap-2 py-2 text-sm text-blue-600 border-t border-dashed border-blue-300">
              <Clock className="h-4 w-4" />
              <span>Il est actuellement {format(new Date(), 'HH:mm', { locale: fr })}</span>
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PlanningPage() {
  const { data: session } = useAuth()
  const { settings } = useSettings()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [courses, setCourses] = useState<Course[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([]) // Toutes les courses chargées
  const [users, setUsers] = useState<User[]>([])
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
    notes: '',
    statut: 'EN_ATTENTE'
  })
  const [assignmentDialog, setAssignmentDialog] = useState<{
    isOpen: boolean
    course?: Course
  }>({ isOpen: false })
  const [isDragging, setIsDragging] = useState(false)
  const [createCourseDialog, setCreateCourseDialog] = useState(false)
  const [courseModal, setCourseModal] = useState<{
    isOpen: boolean;
    course?: Course | null;
    mode: 'create' | 'view' | 'edit';
  }>({ isOpen: false, course: null, mode: 'create' })
  const [clients, setClients] = useState<Client[]>([])
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [courseFormData, setCourseFormData] = useState({
    origine: '',
    destination: '',
    dateHeure: '',
    clientId: '',
    notes: ''
  })
  const [newClientData, setNewClientData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: ''
  })

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Charger les données 1 seule fois
  useEffect(() => {
    if (session) {
      fetchData()
      fetchClients()
    }
  }, [session])

  // Fonction pour filtrer les courses par date
  const filterCoursesByDate = (courses: Course[], date: Date) => {
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    return courses.filter((course: Course) => {
      const courseDate = new Date(course.dateHeure)
      return courseDate >= dayStart && courseDate <= dayEnd
    })
  }

  // Filtrer les courses selon la date sélectionnée
  useEffect(() => {
    if (allCourses.length > 0 && !loading) {
      const filteredCourses = filterCoursesByDate(allCourses, selectedDate)
      setCourses(filteredCourses)
    }
  }, [selectedDate, loading])

  // Re-filtrer quand allCourses change (après ajout/modification de course)
  useEffect(() => {
    if (allCourses.length > 0 && !loading) {
      const filteredCourses = filterCoursesByDate(allCourses, selectedDate)
      setCourses(filteredCourses)
    }
  }, [allCourses.length, loading])

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
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
    }
  }

  // Fonctions pour la modal unifiée
  const handleCreateCourse = () => {
    setCourseModal({ isOpen: true, course: null, mode: 'create' })
  }

  const handleViewCourse = (course: Course) => {
    setCourseModal({ isOpen: true, course, mode: 'view' })
  }

  const handleEditCourse = (course: Course) => {
    setCourseModal({ isOpen: true, course, mode: 'edit' })
  }

  const handleSaveCourse = async (courseData: any) => {
    try {
      const url = courseModal.course
        ? `/api/courses/${courseModal.course.id}`
        : "/api/courses";
      const method = courseModal.course ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        await fetchData(); // Recharger les données
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      throw error; // Relancer pour que le composant puisse gérer l'erreur
    }
  }

  const handleStatusUpdate = async (courseId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statut: newStatus
        }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        throw new Error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      throw error;
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await fetchData();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      throw error;
    }
  }

  const fetchData = async () => {
    try {
      // Pour les chauffeurs, ne charger que leurs courses + non assignées
      const coursesUrl = session?.user?.role === 'Chauffeur' ? `/api/courses?userId=${session.user.id}` : '/api/courses'
      
      const [coursesRes, usersRes] = await Promise.all([
        fetch(coursesUrl),
        fetch('/api/users')
      ])

      const [coursesData, usersData] = await Promise.all([
        coursesRes.json(),
        usersRes.json()
      ])

      // Vérifier si les réponses sont valides
      if (!Array.isArray(coursesData)) {
        console.error('coursesData n\'est pas un tableau:', coursesData)
        setCourses([])
        setUsers([])
        return
      }

      if (!Array.isArray(usersData)) {
        console.error('usersData n\'est pas un tableau:', usersData)
        setCourses([])
        setUsers([])
        return
      }
      
      // Filtrer uniquement les chauffeurs
      let chauffeurs = usersData.filter(user => user.role === 'Chauffeur')
      
      // Si c'est un chauffeur connecté, ne montrer que lui-même
      if (session?.user?.role === 'Chauffeur') {
        chauffeurs = chauffeurs.filter(user => user.id === session.user.id)
      }

      setAllCourses(coursesData) // Stocker toutes les courses
      
      // Filtrage initial pour la date courante
      const filteredCourses = filterCoursesByDate(coursesData, selectedDate)
      setCourses(filteredCourses)
      setUsers(chauffeurs)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseAssign = async (courseId: string, userId: string | null) => {
    console.log('🚀 ASSIGN COURSE:', { courseId, userId })
    try {
      const response = await fetch(`/api/courses/${courseId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId
        }),
      })

      console.log('📡 API Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Assignment successful:', result)
        
        // Mettre à jour directement l'état local au lieu de recharger tout
        const updatedAllCourses = allCourses.map(course => 
          course.id === courseId 
            ? { ...course, userId: userId, statut: userId ? 'ASSIGNEE' : 'EN_ATTENTE' }
            : course
        )
        setAllCourses(updatedAllCourses)
        
        // Filtrer manuellement car la longueur n'a pas changé
        const filteredCourses = filterCoursesByDate(updatedAllCourses, selectedDate)
        setCourses(filteredCourses)
        
        console.log('🔄 Data updated locally')
      } else {
        const result = await response.json()
        console.error('❌ Assignment failed:', result)
      }
    } catch (error) {
      console.error('💥 Error during assignment:', error)
    }
  }

  const getCoursesForChauffeur = (userId: string) => {
    return courses.filter(course => 
      course.user?.id === userId && 
      ['ASSIGNEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'].includes(course.statut)
    )
  }

  const getUnassignedCourses = () => {
    return courses.filter(course => 
      course.statut === 'EN_ATTENTE' && !course.user
    )
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1))
    } else {
      setSelectedDate(addDays(selectedDate, 1))
    }
  }

  // Générer les créneaux horaires selon les préférences (par défaut 7h à 22h)
  const generateTimeSlots = () => {
    const slots = []
    
    // Récupérer les horaires des préférences ou utiliser les valeurs par défaut (24h/24)
    const openingHour = settings?.opening_hours ? parseInt(settings.opening_hours.substring(0, 2)) : 0
    const closingHour = settings?.closing_hours ? parseInt(settings.closing_hours.substring(0, 2)) : 23
    
    // Générer les créneaux de l'ouverture à la fermeture
    for (let hour = openingHour; hour <= closingHour; hour++) {
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
        return course.user ? 'ASSIGNEE' : 'EN_ATTENTE'
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
    
    return users
      .map(chauffeur => {
        // Obtenir toutes les courses de ce chauffeur pour le jour sélectionné
        const allCoursesForDriver = courses.filter(c => 
          c.user?.id === chauffeur.id &&
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

  const getCoursesForChauffeurAtHour = (chauffeurId: string, hour: number) => {
    return courses.filter(course => {
      if (course.user?.id !== chauffeurId) return false
      const courseDate = new Date(course.dateHeure)
      const courseHour = courseDate.getHours()
      
      // Vérifier que c'est le bon jour ET la bonne heure
      const courseDay = courseDate.toDateString()
      const selectedDay = selectedDate.toDateString()
      
      return courseDay === selectedDay && courseHour === hour
    }).sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
  }

  // Fonction legacy pour compatibilité (retourne la première course du créneau)
  const getCourseForChauffeurAtHour = (chauffeurId: string, hour: number) => {
    const coursesAtHour = getCoursesForChauffeurAtHour(chauffeurId, hour)
    return coursesAtHour.length > 0 ? coursesAtHour[0] : null
  }

  const isChauffeurAvailable = (chauffeurId: string, hour: number) => {
    // Un chauffeur peut avoir plusieurs courses sur le même créneau (courses courtes)
    // On considère qu'il est toujours disponible pour en accepter une de plus
    // sauf s'il a déjà beaucoup de courses (plus de 3 par exemple)
    
    const coursesAtHour = getCoursesForChauffeurAtHour(chauffeurId, hour)
    return coursesAtHour.length < 3 // Limite arbitraire de 3 courses par heure
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
    console.log('🚀 DRAG START:', activeId)
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
    if (course && !course.user) {
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

    console.log('🔥 DRAG END:', { activeId: active.id, overId: over?.id })

    if (!over) {
      console.log('❌ No drop target')
      return
    }

    const activeId = active.id as string
    let courseId = activeId
    
    // Si c'est une course du planning, retirer le préfixe
    if (activeId.startsWith('planning-')) {
      courseId = activeId.replace('planning-', '')
    }
    
    console.log('🎯 Course ID extracted:', courseId)
    
    const course = courses.find(c => c.id === courseId)
    if (!course) {
      console.log('❌ Course not found:', courseId)
      return
    }

    const dropId = over.id as string
    console.log('📍 Drop ID:', dropId)
    
    // Si on drop vers "unassigned", désassigner la course
    if (dropId === 'unassigned') {
      console.log('➡️ Unassigning course')
      handleCourseAssign(courseId, null)
      return
    }
    
    // L'ID est de la forme: "uuid-uuid-uuid-uuid-uuid-HEURE"
    const lastDashIndex = dropId.lastIndexOf('-')
    const chauffeurId = dropId.substring(0, lastDashIndex)
    const hourStr = dropId.substring(lastDashIndex + 1)
    const hour = parseInt(hourStr)

    console.log('👤 Chauffeur ID:', chauffeurId, 'Hour:', hour)

    const chauffeur = users.find(c => c.id === chauffeurId)
    if (!chauffeur) {
      console.log('❌ Chauffeur not found:', chauffeurId)
      return
    }

    console.log('✅ Found chauffeur:', chauffeur.nom, chauffeur.prenom)

    // Si la course n'est pas assignée, assigner directement
    if (!course.user) {
      console.log('➡️ Assigning unassigned course')
      handleCourseAssign(courseId, chauffeurId)
      return
    }

    // Si la course est déjà assignée à un autre chauffeur, demander confirmation
    if (course.user.id !== chauffeurId) {
      console.log('⚠️ Reassigning from', course.user.nom, 'to', chauffeur.nom)
      if (confirm(`Êtes-vous sûr de vouloir réassigner cette course à ${chauffeur.nom.toUpperCase()}, ${chauffeur.prenom} ?`)) {
        handleCourseAssign(courseId, chauffeurId)
      }
      return
    }

    console.log('✅ Same chauffeur, no action needed')
    // Si on drop sur le même chauffeur, ne rien faire
  }

  const resetCourseForm = () => {
    setCourseFormData({
      origine: '',
      destination: '',
      dateHeure: format(selectedDate, 'yyyy-MM-dd\'T\'HH:mm'),
      clientId: '',
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

  const handleCreateCourseOld = async (e: React.FormEvent) => {
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
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: course.id,
    })

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div ref={setNodeRef} style={style}>
        <Card 
          {...listeners}
          {...attributes}
          className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-gray-100 border border-gray-300"
          onClickCapture={(e) => {
            // Empêcher le clic pendant le drag
            if (isDragging) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          onClick={(e) => {
            if (!isDragging) {
              e.preventDefault()
              e.stopPropagation()
              // Si la course n'est pas assignée, ouvrir la modal d'assignation
              if (!course.user || course.statut === 'EN_ATTENTE') {
                setAssignmentDialog({ isOpen: true, course })
              } else {
                handleViewCourse(course)
              }
            }
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
      </div>
    )
  }

  // Composant pour les courses dans le planning (draggables également)
  const PlanningCourse = ({ course }: { course: Course }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: `planning-${course.id}`, // Préfixe pour différencier
    })

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div ref={setNodeRef} style={style}>
        <div 
          {...listeners} 
          {...attributes}
          className="bg-gray-100 border border-gray-300 rounded p-2 text-xs cursor-grab active:cursor-grabbing hover:opacity-80 transition-colors w-full overflow-hidden"
          onClickCapture={(e) => {
            // Empêcher le clic pendant le drag
            if (isDragging) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          onClick={(e) => {
            if (!isDragging) {
              e.preventDefault()
              e.stopPropagation()
              // Toujours ouvrir les détails pour les courses dans le planning
              handleViewCourse(course)
            }
          }}
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
    const chauffeur = users.find(c => c.id === chauffeurId)
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
        {/* Vue spéciale verticale pour les chauffeurs */}
        {session && session.user?.role === 'Chauffeur' ? (
          <ChauffeurVerticalPlanning 
            courses={courses}
            selectedDate={selectedDate}
            session={session}
            onCourseClick={(course) => {
              if (!course.user || course.statut === 'EN_ATTENTE') {
                setAssignmentDialog({ isOpen: true, course })
              } else {
                handleViewCourse(course)
              }
            }}
          />
        ) : session ? (
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
                        handleCreateCourse()
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
                    <thead className="sticky top-0 bg-background border-b z-30">
                      <tr>
                        <th 
                          className="sticky left-0 z-40 w-32 p-3 text-left text-xs font-medium text-muted-foreground border-r bg-background"
                          style={{ boxShadow: '2px 0 4px -1px rgba(0, 0, 0, 0.1)' }}
                        >
                          Chauffeur
                        </th>
                        {generateTimeSlots().map((hour) => (
                          <th key={hour} className={`w-36 min-w-[140px] max-w-[140px] p-2 text-center text-xs font-medium border-r z-30 bg-background ${
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
                      {users
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
                            const coursesAtHour = getCoursesForChauffeurAtHour(chauffeur.id, hour)
                            const isCurrentHour = isToday() && hour === getCurrentHour()
                            
                            return (
                              <DroppableSlot key={hour} chauffeurId={chauffeur.id} hour={hour}>
                                <div className={`${isCurrentHour ? 'bg-blue-50' : ''} w-full h-full p-1`}>
                                {coursesAtHour.length > 0 ? (
                                  <div className="space-y-1">
                                    {coursesAtHour.length === 1 ? (
                                      // Une seule course : affichage normal
                                      <PlanningCourse course={coursesAtHour[0]} />
                                    ) : (
                                      // Plusieurs courses : affichage compact
                                      <>
                                        <div className="transform scale-95">
                                          <PlanningCourse course={coursesAtHour[0]} />
                                        </div>
                                        <div className="text-xs text-center text-orange-600 font-medium bg-orange-50 rounded px-1 py-0.5">
                                          +{coursesAtHour.length - 1} autre{coursesAtHour.length > 2 ? 's' : ''}
                                        </div>
                                        {/* Courses supplémentaires en mode très compact */}
                                        {coursesAtHour.slice(1).map((course) => (
                                          <div key={course.id} className="transform scale-75 -mt-1">
                                            <PlanningCourse course={course} />
                                          </div>
                                        ))}
                                      </>
                                    )}
                                  </div>
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
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div>Chargement...</div>
          </div>
        )}

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
            <form onSubmit={handleCreateCourseOld} className="space-y-4">
              {/* Date et heure */}
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
                        <PhoneInput
                          id="clientTelephone"
                          label="Téléphone *"
                          value={newClientData.telephone}
                          onChange={(value) => setNewClientData({ ...newClientData, telephone: value })}
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
                        <Badge 
                          variant={getCourseStatusBadge(courseDetailsDialog.course.statut).variant}
                          className={getCourseStatusBadge(courseDetailsDialog.course.statut).className}
                        >
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
                    {courseDetailsDialog.course.user && (
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Chauffeur assigné
                        </h4>
                        <div className="text-sm">
                          {courseDetailsDialog.course.user.nom.toUpperCase()}, {courseDetailsDialog.course.user.prenom}
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
                          notes: editCourseFormData.notes || null,
                          statut: editCourseFormData.statut,
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

                    <div className="space-y-2">
                      <Label htmlFor="editStatut">Statut</Label>
                      <Select
                        value={editCourseFormData.statut}
                        onValueChange={(value) => setEditCourseFormData({ ...editCourseFormData, statut: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                          <SelectItem value="ASSIGNEE">Assignée</SelectItem>
                          <SelectItem value="EN_COURS">En cours</SelectItem>
                          
                          {/* Terminée et Annulée seulement si course assignée OU déjà dans ces statuts */}
                          {((courseDetailsDialog.course?.user && editCourseFormData.statut !== 'EN_ATTENTE') || 
                            editCourseFormData.statut === 'TERMINEE' || 
                            editCourseFormData.statut === 'ANNULEE') && (
                            <>
                              <SelectItem value="TERMINEE">Terminée</SelectItem>
                              <SelectItem value="ANNULEE">Annulée</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {(!courseDetailsDialog.course?.user || editCourseFormData.statut === 'EN_ATTENTE') && 
                       editCourseFormData.statut !== 'TERMINEE' && editCourseFormData.statut !== 'ANNULEE' && (
                        <p className="text-xs text-muted-foreground">
                          Les statuts "Terminée" et "Annulée" ne sont disponibles que pour les courses assignées.
                        </p>
                      )}
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
                  <div className="space-y-4 pt-4">
                    {/* Actions principales sur deux lignes organisées */}
                    <div className="flex flex-col gap-3">
                      
                      {/* Ligne 1: Actions de statut (si disponibles) */}
                      {courseDetailsDialog.course.user && 
                       courseDetailsDialog.course.statut !== 'TERMINEE' && 
                       courseDetailsDialog.course.statut !== 'ANNULEE' && (
                        <div className="flex gap-2 justify-center">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/courses/${courseDetailsDialog.course!.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    ...courseDetailsDialog.course,
                                    statut: 'TERMINEE',
                                    clientId: courseDetailsDialog.course!.client.id,
                                    userId: courseDetailsDialog.course!.user?.id || null,
                                  }),
                                })

                                if (response.ok) {
                                  await fetchData()
                                  setCourseDetailsDialog({ isOpen: false })
                                } else {
                                  alert('Erreur lors de la mise à jour du statut')
                                }
                              } catch (error) {
                                console.error('Erreur:', error)
                                alert('Erreur lors de la mise à jour du statut')
                              }
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Terminer la course
                          </Button>
                          <Button 
                            variant="destructive"
                            className="flex-1"
                            onClick={async () => {
                              if (confirm('Êtes-vous sûr de vouloir annuler cette course ?')) {
                                try {
                                  const response = await fetch(`/api/courses/${courseDetailsDialog.course!.id}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      ...courseDetailsDialog.course,
                                      statut: 'ANNULEE',
                                      clientId: courseDetailsDialog.course!.client.id,
                                      userId: courseDetailsDialog.course!.user?.id || null,
                                    }),
                                  })

                                  if (response.ok) {
                                    await fetchData()
                                    setCourseDetailsDialog({ isOpen: false })
                                  } else {
                                    alert('Erreur lors de la mise à jour du statut')
                                  }
                                } catch (error) {
                                  console.error('Erreur:', error)
                                  alert('Erreur lors de la mise à jour du statut')
                                }
                              }
                            }}
                          >
                            Annuler la course
                          </Button>
                        </div>
                      )}

                      {/* Ligne 2: Actions d'assignation et modification */}
                      <div className="flex gap-2 justify-center">
                        {courseDetailsDialog.course.statut === 'EN_ATTENTE' && (
                          <Button 
                            className="flex-1"
                            onClick={() => {
                              setCourseDetailsDialog({ isOpen: false })
                              setAssignmentDialog({ isOpen: true, course: courseDetailsDialog.course })
                            }}
                          >
                            Assigner
                          </Button>
                        )}
                        {courseDetailsDialog.course.user && (
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={async () => {
                              await handleCourseAssign(courseDetailsDialog.course!.id, null)
                              setCourseDetailsDialog({ isOpen: false })
                            }}
                          >
                            Désassigner
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setEditCourseFormData({
                              origine: courseDetailsDialog.course!.origine,
                              destination: courseDetailsDialog.course!.destination,
                              dateHeure: new Date(courseDetailsDialog.course!.dateHeure).toLocaleString('sv-SE').slice(0, 16),
                              notes: courseDetailsDialog.course!.notes || '',
                              statut: courseDetailsDialog.course!.statut
                            })
                            setEditingCourse(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    </div>

                    {/* Bouton Fermer en bas, centré */}
                    <div className="flex justify-center pt-2 border-t">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setCourseDetailsDialog({ isOpen: false })
                          setEditingCourse(false)
                        }}
                      >
                        Fermer
                      </Button>
                    </div>
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
                                (() => {
                                  const badgeStyle = getDefaultBadge()
                                  return <Badge variant={badgeStyle.variant} className={`${badgeStyle.className} text-xs`}>
                                    Horaire incompatible
                                  </Badge>
                                })()
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
            transformOrigin: '0 0',
            zIndex: 9999,
          }}
          modifiers={[
            (args) => {
              // Décaler la card pour que le curseur soit au centre
              return {
                ...args,
                transform: {
                  ...args.transform,
                  x: args.transform.x - 75, // Moitié de la largeur approximative de la card
                  y: args.transform.y - 30, // Moitié de la hauteur approximative de la card
                },
              }
            }
          ]}
        >
          {activeId && activeCourse ? (
            <div style={{ 
              opacity: 0.95, 
              transform: 'rotate(5deg)', 
              filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.3))',
              pointerEvents: 'none'
            }}>
              <DraggableCourse course={activeCourse} />
            </div>
          ) : null}
        </DragOverlay>

        {/* Modal unifiée */}
        <CourseModal
          isOpen={courseModal.isOpen}
          onClose={() => setCourseModal({ isOpen: false, course: null, mode: 'create' })}
          course={courseModal.course}
          mode={courseModal.mode}
          clients={clients}
          users={users}
          onSave={handleSaveCourse}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDeleteCourse}
        />
      </div>
    </div>
    </DndContext>
  )
}