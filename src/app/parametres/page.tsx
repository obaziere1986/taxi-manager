"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getRoleBadge, getUserStatusBadge, getAssignationBadge, getInactiveBadge, UNIFORM_BADGE_CLASSES } from '@/lib/badge-utils'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { PhoneInput } from "@/components/ui/phone-input"
import { PlateInput } from "@/components/ui/plate-input"
import { 
  Car, 
  Users, 
  Settings, 
  MessageSquare, 
  FileText, 
  Plus, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
  User,
  Calendar,
  Fuel,
  Wrench,
  History,
  ArrowRight,
  UserPlus,
  UserRoundMinus,
  Camera,
  Bell,
  Save,
  Copy,
  CalendarPlus,
  HelpCircle,
  Check,
  X
} from "lucide-react"
import { VehiculeModal } from '@/components/vehicules/VehiculeModal'
import { DeleteVehiculeModal } from '@/components/vehicules/DeleteVehiculeModal'
import { UserModal } from '@/components/effectifs/UserModal'
import { DeleteUserModal } from '@/components/effectifs/DeleteUserModal'
import { VehiculeAssignationModal } from '@/components/effectifs/VehiculeAssignationModal'
import { VehicleAssignModal } from '@/components/vehicules/VehicleAssignModal'
import { getVehiculeAlerts, getAlertBadgeVariant } from '@/lib/vehicule-alerts'
import { CalendarPreferences } from '@/components/settings/CalendarPreferences'
import { useCalendarPermission } from '@/hooks/useCalendarPermission'
import { ProtectedComponent } from '@/components/auth/ProtectedComponent'
import { CompanySettings } from '@/components/settings/CompanySettings'
import MailSettings from '@/components/mail/MailSettings'
import ReviewsAdmin from '@/components/reviews/ReviewsAdmin'

interface Vehicule {
  id: string
  marque: string
  modele: string
  immatriculation: string
  couleur?: string
  annee?: number
  actif: boolean
  kilometrage?: number
  carburant?: string
  prochaineVidange?: string
  prochainEntretien?: string
  prochainControleTechnique?: string
  notes?: string
  isAssigned?: boolean
  assignation?: {
    id: string
    dateDebut: string
    assignedTo: string
    assignedToRole: string
  }
  chauffeurs?: Array<{ id: string; nom: string; prenom: string }>
  assignations?: Array<{
    id: string
    actif: boolean
    chauffeur?: { id: string; nom: string; prenom: string; statut: string }
    user?: { id: string; nom: string; prenom: string; role: string }
  }>
}

interface VehiculeAssignation {
  id: string
  dateDebut: string
  dateFin?: string
  actif: boolean
  notes?: string
  vehicule: {
    id: string
    marque: string
    modele: string
    immatriculation: string
  }
  chauffeur?: {
    id: string
    nom: string
    prenom: string
  }
  user?: {
    id: string
    nom: string
    prenom: string
    role: string
  }
}

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: 'Admin' | 'Planner' | 'Chauffeur'
  statut?: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  actif: boolean
  createdAt: string
  updatedAt: string
  calendar_token?: string
}


interface CombinedUser {
  id: string
  nom: string
  prenom: string
  telephone?: string
  email?: string
  role: 'Admin' | 'Planner' | 'Chauffeur'
  statut?: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  vehicule?: string
  vehiculeId?: string
  assignedVehicle?: {
    id: string
    marque: string
    modele: string
    immatriculation: string
  }
  actif: boolean
  createdAt: string
  source: 'users'
  calendar_token?: string
}

export default function ParametresPage() {
  const { data: session } = useAuth()
  const [activeTab, setActiveTab] = useState("profil")
  const { isEnabled: calendarEnabled, getCalendarUrl } = useCalendarPermission()
  const [copiedCalendar, setCopiedCalendar] = useState<string | null>(null)
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [assignations, setAssignations] = useState<VehiculeAssignation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [combinedUsers, setCombinedUsers] = useState<CombinedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAssignations, setLoadingAssignations] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showInactiveUsers, setShowInactiveUsers] = useState(false)
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([])
  const [loadingInactiveUsers, setLoadingInactiveUsers] = useState(false)
  
  // États des modales véhicules
  const [vehiculeModal, setVehiculeModal] = useState<{
    isOpen: boolean
    mode: 'create' | 'edit'
    vehicule?: Vehicule | null
  }>({ isOpen: false, mode: 'create', vehicule: null })
  
  const [deleteVehiculeModal, setDeleteVehiculeModal] = useState<{
    isOpen: boolean
    vehicule?: Vehicule | null
  }>({ isOpen: false, vehicule: null })

  // États des modales utilisateurs
  const [userModal, setUserModal] = useState<{
    isOpen: boolean
    mode: 'create' | 'edit'
    user?: User | null
  }>({ isOpen: false, mode: 'create', user: null })
  
  const [deleteUserModal, setDeleteUserModal] = useState<{
    isOpen: boolean
    user?: User | null
  }>({ isOpen: false, user: null })


  // États de la modale d'assignation véhicule
  const [assignationModal, setAssignationModal] = useState<{
    isOpen: boolean
    chauffeur?: any | null
    user?: any | null
  }>({ isOpen: false, chauffeur: null, user: null })

  // État de la nouvelle modale d'assignation depuis véhicule
  const [vehicleAssignModal, setVehicleAssignModal] = useState<{
    isOpen: boolean
    vehicule?: Vehicule | null
  }>({ isOpen: false, vehicule: null })

  // Charger les données selon l'onglet actif
  useEffect(() => {
    if (activeTab === 'vehicules') {
      fetchVehicules()
      fetchAssignations()
    } else if (activeTab === 'effectifs') {
      fetchUsers()
      fetchVehicules() // Nécessaire pour les assignations
    }
  }, [activeTab])

  const fetchVehicules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vehicules/with-assignations')
      const data = await response.json()
      
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setVehicules(data)
      } else {
        console.error('Données invalides pour véhicules:', data)
        setVehicules([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
      setVehicules([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignations = async () => {
    try {
      setLoadingAssignations(true)
      const response = await fetch('/api/vehicules/assignations/robust')
      const data = await response.json()
      
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setAssignations(data)
      } else {
        console.error('Les données d\'assignations ne sont pas un tableau:', data)
        setAssignations([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des assignations:', error)
      setAssignations([])
    } finally {
      setLoadingAssignations(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      console.log('🔄 Chargement des utilisateurs...')
      
      const response = await fetch('/api/users')
      console.log('📡 Réponse API users:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📊 Utilisateurs reçus:', data.length, 'utilisateurs')
      
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.error('❌ Données invalides pour utilisateurs:', data)
        setUsers([])
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error)
      setUsers([]) // Assurer qu'on a un tableau vide en cas d'erreur
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchInactiveUsers = async () => {
    try {
      setLoadingInactiveUsers(true)
      console.log('🔄 Chargement des utilisateurs inactifs...')
      
      const response = await fetch('/api/users?inactive=true')
      console.log('📡 Réponse API users inactifs:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📊 Utilisateurs inactifs reçus:', data.length, 'utilisateurs')
      
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setInactiveUsers(data)
      } else {
        console.error('❌ Données invalides pour utilisateurs inactifs:', data)
        setInactiveUsers([])
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs inactifs:', error)
      setInactiveUsers([]) // Assurer qu'on a un tableau vide en cas d'erreur
    } finally {
      setLoadingInactiveUsers(false)
    }
  }


  // Enrichir les utilisateurs avec leurs assignations véhicules
  useEffect(() => {
    const enrichUsersWithVehicles = async () => {
      let allUsers: User[]
      
      if (showInactiveUsers) {
        // Combiner les deux listes en évitant les doublons
        const userIds = new Set(users.map(u => u.id))
        const uniqueInactiveUsers = inactiveUsers.filter(u => !userIds.has(u.id))
        allUsers = [...users, ...uniqueInactiveUsers]
      } else {
        allUsers = users
      }
      
      const combined: CombinedUser[] = [
        // Tous les utilisateurs (incluant les chauffeurs)
        ...allUsers.map(user => ({
          ...user,
          role: user.role,
          source: 'users' as const
        }))
      ]
      
      // Enrichir chaque utilisateur avec son véhicule assigné
      const enrichedUsers = await Promise.all(
        combined.map(async (person) => {
          try {
            const params = new URLSearchParams()
            params.set('userId', person.id)
            
            const response = await fetch(`/api/vehicules/assignations/by-person?${params}`)
            const assignations = await response.json()
            
            const activeAssignation = assignations.find((a: any) => a.actif)
            
            return {
              ...person,
              assignedVehicle: activeAssignation?.vehicule || null
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du véhicule assigné:', error)
            return person
          }
        })
      )
      
      // Trier par rôle puis nom
      enrichedUsers.sort((a, b) => {
        const roleOrder = { 'Admin': 1, 'Planner': 2, 'Chauffeur': 3 }
        const roleCompare = roleOrder[a.role] - roleOrder[b.role]
        if (roleCompare !== 0) return roleCompare
        return (a.nom + a.prenom).localeCompare(b.nom + b.prenom)
      })
      
      setCombinedUsers(enrichedUsers)
    }

    if (users.length > 0 || inactiveUsers.length > 0) {
      enrichUsersWithVehicles()
    }
  }, [users, inactiveUsers, showInactiveUsers])

  const handleSaveVehicule = async (vehiculeData: Vehicule) => {
    try {
      const url = vehiculeModal.mode === 'create' 
        ? '/api/vehicules' 
        : `/api/vehicules/${vehiculeData.id}`
        
      const method = vehiculeModal.mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehiculeData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }
      
      await fetchVehicules()
      setVehiculeModal({ isOpen: false, mode: 'create', vehicule: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleDeleteVehicule = async (vehiculeId: string) => {
    try {
      const response = await fetch(`/api/vehicules/${vehiculeId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      
      await fetchVehicules()
      setDeleteVehiculeModal({ isOpen: false, vehicule: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleSaveUser = async (userData: User) => {
    try {
      const url = userModal.mode === 'create' 
        ? '/api/users' 
        : `/api/users/${userData.id}`
        
      const method = userModal.mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }
      
      // Rafraîchir les deux listes
      await refreshUserLists()
      setUserModal({ isOpen: false, mode: 'create', user: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      
      await refreshUserLists()
      setDeleteUserModal({ isOpen: false, user: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const refreshUserLists = async () => {
    await fetchUsers()
    if (showInactiveUsers) {
      await fetchInactiveUsers()
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !currentStatus })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la modification du statut')
      }
      
      // Recharger automatiquement les listes appropriées
      await refreshUserLists()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la modification du statut de l\'utilisateur')
    }
  }

  const handlePermanentDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permanent: true })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression définitive')
      }
      
      // Recharger les listes appropriées
      await refreshUserLists()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression définitive de l\'utilisateur')
    }
  }


  const handleAssignVehicule = async (assignationData: any) => {
    try {
      const response = await fetch('/api/vehicules/assignations/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignationData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'assignation')
      }
      
      // Recharger les données
      await fetchUsers()
      await fetchVehicules()
      await fetchAssignations()
      setAssignationModal({ isOpen: false, chauffeur: null, user: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleAssignVehicleFromCard = (vehicule: Vehicule) => {
    console.log('📝 Assignation véhicule depuis card:', vehicule.immatriculation)
    setVehicleAssignModal({ 
      isOpen: true, 
      vehicule: vehicule
    })
  }

  const handleUnassignVehicle = async (vehicule: Vehicule) => {
    if (!vehicule.isAssigned || !vehicule.assignation) return

    const assignedTo = vehicule.assignation.assignedTo

    if (confirm(`Désassigner ${vehicule.marque} ${vehicule.modele} de ${assignedTo} ?`)) {
      try {
        console.log('🔄 Désassignation véhicule:', vehicule.immatriculation, 'de', assignedTo)
        
        const response = await fetch(`/api/vehicules/assignations/${vehicule.assignation.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          let errorMessage = 'Erreur lors de la désassignation'
          try {
            const error = await response.json()
            errorMessage = error.error || errorMessage
          } catch {
            // Si ce n'est pas du JSON, utiliser le texte de la réponse
            const textError = await response.text()
            console.error('Réponse non-JSON reçue:', textError)
            if (textError.includes('<!DOCTYPE')) {
              errorMessage = `Erreur serveur (${response.status})`
            } else {
              errorMessage = textError || errorMessage
            }
          }
          throw new Error(errorMessage)
        }
        
        console.log('✅ Véhicule désassigné avec succès')
        
        // Recharger les données
        await fetchVehicules()
        await fetchAssignations()
        await fetchUsers()
      } catch (error) {
        console.error('❌ Erreur lors de la désassignation:', error)
        alert('Erreur lors de la désassignation du véhicule')
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title="Paramètres" />

      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Cacher les onglets pour les chauffeurs qui n'ont que le profil */}
          {session?.user?.role !== 'Chauffeur' && (
            <TabsList className={`grid w-full ${
              session?.user?.role === 'Admin' ? 'grid-cols-7' : 'grid-cols-3'
            }`}>
              <TabsTrigger value="profil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Mon Profil
              </TabsTrigger>
              <ProtectedComponent permissions={["vehicles.read"]}>
                <TabsTrigger value="vehicules" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Véhicules
                </TabsTrigger>
              </ProtectedComponent>
              <ProtectedComponent permissions={["users.read"]}>
                <TabsTrigger value="effectifs" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Effectifs
                </TabsTrigger>
              </ProtectedComponent>
              {session?.user?.role === 'Admin' && (
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Préférences
                </TabsTrigger>
              )}
              {session?.user?.role === 'Admin' && (
                <TabsTrigger value="permissions" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Permissions
                </TabsTrigger>
              )}
              {session?.user?.role === 'Admin' && (
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              )}
              {session?.user?.role === 'Admin' && (
                <TabsTrigger value="reviews" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Avis Clients
                </TabsTrigger>
              )}
            </TabsList>
          )}

          {/* Section Profil */}
          <TabsContent value="profil" className="space-y-6">
            <ProfilSection />
          </TabsContent>

          {/* Section Véhicules */}
          <ProtectedComponent permissions={["vehicles.read"]}>
            <TabsContent value="vehicules" className="space-y-6">
              <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Gestion des véhicules
                    </CardTitle>
                    <CardDescription>
                      Gérer le parc automobile de la société
                    </CardDescription>
                  </div>
                  <Button onClick={() => setVehiculeModal({ isOpen: true, mode: 'create', vehicule: null })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau véhicule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicules.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Car className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucun véhicule enregistré</p>
                      </div>
                    ) : (
                      vehicules.map((vehicule) => {
                        const alerts = getVehiculeAlerts(vehicule)
                        const hasCriticalAlert = alerts.some(alert => alert.level === 'critical')
                        const hasUrgentAlert = alerts.some(alert => alert.level === 'danger')
                        const hasAlert = alerts.length > 0
                        
                        return (
                          <div key={vehicule.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold">
                                    {vehicule.marque} {vehicule.modele}
                                  </h3>
                                  <Badge 
                                    variant={vehicule.actif ? "default" : "secondary"} 
                                    className="text-xs font-medium px-2 py-1"
                                  >
                                    {vehicule.actif ? "Actif" : "Inactif"}
                                  </Badge>
                                  {alerts.map((alert, index) => (
                                    <Badge 
                                      key={index}
                                      variant={getAlertBadgeVariant(alert.level)} 
                                      className={`text-xs ${alert.level === 'critical' ? 'animate-pulse' : ''}`}
                                    >
                                      <Wrench className="h-3 w-3 mr-1" />
                                      {alert.message}
                                    </Badge>
                                  ))}
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">
                                    {vehicule.immatriculation}
                                    {vehicule.annee && ` • ${vehicule.annee}`}
                                    {vehicule.couleur && ` • ${vehicule.couleur}`}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {vehicule.carburant && (
                                      <span className="flex items-center gap-1">
                                        <Fuel className="h-3 w-3" />
                                        {vehicule.carburant}
                                      </span>
                                    )}
                                    {vehicule.kilometrage !== null && vehicule.kilometrage !== undefined && (
                                      <span>{vehicule.kilometrage.toLocaleString()} km</span>
                                    )}
                                  </div>
                                  
                                  {(() => {
                                    if (vehicule.isAssigned && vehicule.assignation) {
                                      return (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          Assigné à: {vehicule.assignation.assignedTo} ({vehicule.assignation.assignedToRole})
                                        </p>
                                      )
                                    } else {
                                      return (
                                        <p className="text-xs text-muted-foreground">
                                          Non assigné
                                        </p>
                                      )
                                    }
                                  })()}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {/* Bouton d'assignation/désassignation */}
                                {(() => {
                                  if (vehicule.isAssigned && vehicule.assignation) {
                                    // Véhicule assigné - bouton de désassignation
                                    return (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        title="Désassigner ce véhicule"
                                        onClick={() => handleUnassignVehicle(vehicule)}
                                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                                      >
                                        <UserRoundMinus className="h-4 w-4" />
                                      </Button>
                                    )
                                  } else {
                                    // Véhicule libre - bouton d'assignation
                                    return (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        title="Assigner ce véhicule"
                                        onClick={() => handleAssignVehicleFromCard(vehicule)}
                                        className="text-green-600 hover:text-green-700 hover:border-green-300"
                                      >
                                        <UserPlus className="h-4 w-4" />
                                      </Button>
                                    )
                                  }
                                })()}
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setVehiculeModal({ 
                                    isOpen: true, 
                                    mode: 'edit', 
                                    vehicule 
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setDeleteVehiculeModal({ 
                                    isOpen: true, 
                                    vehicule 
                                  })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historique des assignations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique des assignations
                </CardTitle>
                <CardDescription>
                  Suivi des assignations véhicule-personne (chauffeurs, admins, planneurs)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAssignations ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!Array.isArray(assignations) || assignations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucune assignation enregistrée</p>
                      </div>
                    ) : (
                      assignations.map((assignation) => (
                        <div key={assignation.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">
                                    {assignation.vehicule.marque} {assignation.vehicule.modele}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    ({assignation.vehicule.immatriculation})
                                  </span>
                                </div>
                                
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-green-500" />
                                  <span className="font-medium">
                                    {assignation.chauffeur ? 
                                      `${assignation.chauffeur.nom.toUpperCase()}, ${assignation.chauffeur.prenom}` :
                                      `${assignation.user.nom.toUpperCase()}, ${assignation.user.prenom}`
                                    }
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs font-medium px-2 py-1 ml-2"
                                  >
                                    {assignation.chauffeur ? 'Chauffeur' : assignation.user?.role}
                                  </Badge>
                                </div>
                                
                                <Badge 
                                  variant={assignation.actif ? "default" : "secondary"} 
                                  className="text-xs font-medium px-2 py-1"
                                >
                                  {assignation.actif ? "Actif" : "Terminé"}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>
                                  Début: {new Date(assignation.dateDebut).toLocaleDateString('fr-FR')}
                                </span>
                                {assignation.dateFin && (
                                  <span>
                                    Fin: {new Date(assignation.dateFin).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                                {assignation.actif && (
                                  <span className="text-green-600">
                                    • En cours depuis {Math.floor((new Date().getTime() - new Date(assignation.dateDebut).getTime()) / (1000 * 60 * 60 * 24))} jours
                                  </span>
                                )}
                              </div>
                              
                              {assignation.notes && (
                                <p className="text-xs text-muted-foreground italic">
                                  {assignation.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </ProtectedComponent>

          {/* Section Effectifs */}
          <ProtectedComponent permissions={["users.read"]}>
            <TabsContent value="effectifs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Gestion des effectifs
                    </CardTitle>
                    <CardDescription>
                      Gérer tous les utilisateurs : admins, planneurs et chauffeurs
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* Bouton pour afficher/cacher les utilisateurs désactivés */}
                    <Button 
                      variant={showInactiveUsers ? "default" : "outline"}
                      onClick={() => {
                        setShowInactiveUsers(!showInactiveUsers)
                        if (!showInactiveUsers && inactiveUsers.length === 0) {
                          fetchInactiveUsers()
                        }
                      }}
                    >
                      <UserRoundMinus className="h-4 w-4 mr-2" />
                      {showInactiveUsers ? "Masquer désactivés" : "Afficher désactivés"}
                    </Button>
                    
                    {/* Seuls les Admins peuvent créer des utilisateurs */}
                    {session?.user?.role === 'Admin' && (
                      <Button onClick={() => setUserModal({ isOpen: true, mode: 'create', user: null })}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel utilisateur
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {combinedUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucune personne enregistrée</p>
                      </div>
                    ) : (
                      combinedUsers.map((person) => {
                        const getRoleIcon = (role: string) => {
                          switch (role) {
                            case 'Admin': return <Shield className="h-4 w-4" />
                            case 'Planner': return <User className="h-4 w-4" />
                            case 'Chauffeur': return <Car className="h-4 w-4" />
                            default: return <User className="h-4 w-4 text-gray-500" />
                          }
                        }

                        const getRoleDisplay = (role: string) => {
                          const badgeStyle = getRoleBadge(role)
                          return <Badge variant={badgeStyle.variant} className={badgeStyle.className}>{role}</Badge>
                        }

                        const getStatutDisplay = (statut?: string) => {
                          if (!statut) return null
                          const badgeStyle = getUserStatusBadge(statut)
                          return <Badge variant={badgeStyle.variant} className={badgeStyle.className}>{
                            statut === 'DISPONIBLE' ? 'Disponible' : 
                            statut === 'OCCUPE' ? 'Occupé' :
                            statut === 'HORS_SERVICE' ? 'Hors service' : statut
                          }</Badge>
                        }

                        return (
                          <div key={`user-${person.id}-${person.actif ? 'active' : 'inactive'}`} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(person.role)}
                                  <h3 className="font-semibold">
                                    {person.nom.toUpperCase()}, {person.prenom}
                                  </h3>
                                  {getRoleDisplay(person.role)}
                                  {/* Afficher le statut seulement si la personne est active */}
                                  {person.actif && getStatutDisplay(person.statut)}
                                  {/* Badge inactif rouge si la personne n'est pas active */}
                                  {!person.actif && (
                                    <Badge 
                                      variant={getInactiveBadge().variant}
                                      className={getInactiveBadge().className}
                                    >
                                      Inactif
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground flex items-center flex-wrap gap-x-2">
                                    {person.email && (<><Mail className="h-4 w-4 inline" />{person.email}</>)}
                                    {person.telephone && (<><span className="mx-1">•</span><Phone className="h-4 w-4 inline" />{person.telephone}</>)}
                                  </p>
                                  {person.assignedVehicle && (
                                    <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                      <Car className="h-3 w-3" />
                                      Véhicule assigné: {person.assignedVehicle.marque} {person.assignedVehicle.modele} ({person.assignedVehicle.immatriculation})
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Utilisateur depuis le {person.created_at ? new Date(person.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {/* Calendrier ICS pour les chauffeurs */}
                                {person.role === 'Chauffeur' && calendarEnabled && person.calendar_token && (
                                  <Button 
                                    variant={copiedCalendar === person.id ? "default" : "outline"}
                                    size="sm"
                                    title={copiedCalendar === person.id ? "Lien copié !" : "Copier le lien calendrier ICS"}
                                    onClick={async () => {
                                      const url = getCalendarUrl(person.calendar_token!)
                                      if (url) {
                                        try {
                                          await navigator.clipboard.writeText(url)
                                          setCopiedCalendar(person.id)
                                          setTimeout(() => setCopiedCalendar(null), 2000)
                                        } catch (error) {
                                          alert('Erreur lors de la copie')
                                        }
                                      }
                                    }}
                                    className={copiedCalendar === person.id ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    {copiedCalendar === person.id ? (
                                      <Calendar className="h-4 w-4" />
                                    ) : (
                                      <CalendarPlus className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                
                                {/* Tous les utilisateurs actifs peuvent avoir un véhicule assigné */}
                                {person.actif && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    title="Assigner un véhicule"
                                    onClick={() => setAssignationModal({ 
                                      isOpen: true, 
                                      chauffeur: null,
                                      user: users.find(u => u.id === person.id) || null
                                    })}
                                  >
                                    <Car className="h-4 w-4" />
                                  </Button>
                                )}
                                {/* Empêcher les Planners de modifier les Admins */}
                                {(session?.user?.role === 'Admin' || 
                                  (session?.user?.role === 'Planner' && person.role !== 'Admin')) && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      const user = users.find(u => u.id === person.id) || inactiveUsers.find(u => u.id === person.id)
                                      setUserModal({ isOpen: true, mode: 'edit', user })
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {/* Boutons selon le statut actif/inactif */}
                                {session?.user?.role === 'Admin' && (
                                  <>
                                    {person.actif ? (
                                      // Utilisateur actif - bouton de désactivation
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        title="Désactiver l'utilisateur"
                                        onClick={() => {
                                          if (confirm(`Désactiver l'utilisateur ${person.prenom} ${person.nom} ?`)) {
                                            handleToggleUserStatus(person.id, person.actif)
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      // Utilisateur inactif - boutons de réactivation et suppression définitive
                                      <>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          title="Réactiver l'utilisateur"
                                          onClick={() => {
                                            if (confirm(`Réactiver l'utilisateur ${person.prenom} ${person.nom} ?`)) {
                                              handleToggleUserStatus(person.id, person.actif)
                                            }
                                          }}
                                          className="text-green-600 hover:text-green-700 hover:border-green-300"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          title="Supprimer définitivement"
                                          onClick={() => {
                                            if (confirm(`ATTENTION: Supprimer définitivement ${person.prenom} ${person.nom} ? Cette action est irréversible !`)) {
                                              handlePermanentDeleteUser(person.id)
                                            }
                                          }}
                                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </ProtectedComponent>

          {/* Section Préférences */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Entreprise & Identité */}
            <CompanySettings />

            {/* Calendriers ICS */}
            <CalendarPreferences />

            {/* Actions de sauvegarde */}
            <div className="flex justify-end pt-4">
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les modifications
              </Button>
            </div>
          </TabsContent>


          {/* Section Permissions (Admin uniquement) */}
          {session?.user?.role === 'Admin' && (
            <TabsContent value="permissions" className="space-y-6">
              <PermissionsSection />
            </TabsContent>
          )}
          
          {/* Section Notifications (Admin uniquement) */}
          {session?.user?.role === 'Admin' && (
            <TabsContent value="notifications" className="space-y-6">
              <MailSettings />
            </TabsContent>
          )}
          
          {/* Section Avis Clients (Admin uniquement) */}
          {session?.user?.role === 'Admin' && (
            <TabsContent value="reviews" className="space-y-6">
              <ReviewsAdmin />
            </TabsContent>
          )}

        </Tabs>
      </div>
      
      {/* Modales */}
      <VehiculeModal
        isOpen={vehiculeModal.isOpen}
        onClose={() => setVehiculeModal({ isOpen: false, mode: 'create', vehicule: null })}
        onSave={handleSaveVehicule}
        vehicule={vehiculeModal.vehicule}
        mode={vehiculeModal.mode}
      />
      
      <DeleteVehiculeModal
        isOpen={deleteVehiculeModal.isOpen}
        onClose={() => setDeleteVehiculeModal({ isOpen: false, vehicule: null })}
        onDelete={handleDeleteVehicule}
        vehicule={deleteVehiculeModal.vehicule}
      />
      
      {/* Modales utilisateurs */}
      <UserModal
        isOpen={userModal.isOpen}
        onClose={() => setUserModal({ isOpen: false, mode: 'create', user: null })}
        onSave={handleSaveUser}
        onPermanentDelete={handlePermanentDeleteUser}
        user={userModal.user}
        mode={userModal.mode}
      />
      
      <DeleteUserModal
        isOpen={deleteUserModal.isOpen}
        onClose={() => setDeleteUserModal({ isOpen: false, user: null })}
        onDelete={handleDeleteUser}
        user={deleteUserModal.user}
      />
      
      
      {/* Modale assignation véhicule */}
      <VehiculeAssignationModal
        isOpen={assignationModal.isOpen}
        onClose={() => setAssignationModal({ isOpen: false, chauffeur: null, user: null })}
        onAssign={handleAssignVehicule}
        chauffeur={assignationModal.chauffeur}
        user={assignationModal.user}
      />
      
      {/* Modale assignation depuis véhicule */}
      <VehicleAssignModal
        isOpen={vehicleAssignModal.isOpen}
        onClose={() => setVehicleAssignModal({ isOpen: false, vehicule: null })}
        onAssign={handleAssignVehicule}
        vehicule={vehicleAssignModal.vehicule}
      />
    </div>
  )
}

// Composant pour la section Profil
function ProfilSection() {
  const { data: session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    notificationsEmail: true,
    notificationsSMS: false,
    notificationsDesktop: true,
    avatarUrl: ''
  })
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Fonction pour charger les données du profil
  const fetchProfile = async () => {
    if (!session?.user) return
    
    try {
      setIsLoadingProfile(true)
      const response = await fetch('/api/users/profile')
      
      if (response.ok) {
        const profileData = await response.json()
        setFormData({
          nom: profileData.nom || '',
          prenom: profileData.prenom || '',
          email: profileData.email || '',
          telephone: profileData.telephone || '',
          notificationsEmail: profileData.notifications_email ?? true,
          notificationsSMS: profileData.notifications_sms ?? false,
          notificationsDesktop: profileData.notifications_desktop ?? true,
          avatarUrl: profileData.avatar_url || ''
        })
      } else {
        console.error('Erreur lors du chargement du profil')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Charger les données du profil depuis l'API
  useEffect(() => {
    fetchProfile()
  }, [session])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({ ...prev, avatarUrl: result.avatarUrl }))
        
        // Mettre à jour la session NextAuth
        await update({
          ...session,
          user: {
            ...session?.user,
            avatarUrl: result.avatarUrl
          }
        })
        
        // Recharger les données du profil pour mettre à jour l'interface
        await fetchProfile()
        
        alert('Photo de profil mise à jour avec succès !')
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      alert('Erreur lors de l\'upload de l\'image')
    } finally {
      setIsUploadingAvatar(false)
      // Reset input file
      event.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      const response = await fetch('/api/users/avatar', {
        method: 'DELETE'
      })

      if (response.ok) {
        setFormData(prev => ({ ...prev, avatarUrl: '' }))
        
        // Mettre à jour la session NextAuth
        await update({
          ...session,
          user: {
            ...session?.user,
            avatarUrl: null
          }
        })
        
        // Recharger les données du profil pour mettre à jour l'interface
        await fetchProfile()
        
        alert('Photo de profil supprimée')
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression avatar:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        
        // Mettre à jour la session avec les nouvelles données
        await update({
          name: `${updatedProfile.prenom} ${updatedProfile.nom}`,
          email: updatedProfile.email
        })
        
        alert('Profil sauvegardé avec succès !')
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user || isLoadingProfile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Chargement du profil...</p>
        </CardContent>
      </Card>
    )
  }

  const firstName = session.user.name?.split(' ')[0] || 'Utilisateur'
  const initials = `${session.user.name?.split(' ')[0]?.[0] || ''}${session.user.name?.split(' ')[1]?.[0] || ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mon Profil
          </CardTitle>
          <CardDescription>
            Gérez vos informations personnelles et vos préférences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo de profil */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Photo de profil"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center text-foreground font-bold text-xl">
                  {initials}
                </div>
              )}
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                disabled={isUploadingAvatar}
                onClick={() => document.getElementById('avatar-input')?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium">Photo de profil</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Ajoutez une photo pour personnaliser votre profil (JPG, PNG, WebP - max 5MB)
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isUploadingAvatar}
                  onClick={() => document.getElementById('avatar-input')?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isUploadingAvatar ? 'Upload...' : 'Changer la photo'}
                </Button>
                {formData.avatarUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isUploadingAvatar}
                    onClick={handleRemoveAvatar}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          <Separator />

          {/* Informations de base */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => handleInputChange('prenom', e.target.value)}
                placeholder="Votre prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="votre.email@example.com"
              />
            </div>
            <div className="space-y-2">
              <PhoneInput
                id="telephone"
                label="Numéro de téléphone"
                value={formData.telephone}
                onChange={(value) => handleInputChange('telephone', value)}
              />
            </div>
          </div>

          <div className="bg-muted/20 p-3 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rôle: {session.user.role}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Votre rôle détermine vos permissions dans l'application
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </Button>
      </div>
    </div>
  )
}

// Composant pour la section Permissions (Admin uniquement)
function PermissionsSection() {
  const [permissions, setPermissions] = useState<any>({})
  const [rolePermissions, setRolePermissions] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions)
        setRolePermissions(data.rolePermissions)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRolePermissions = async (role: string, permissionName: string, isActive: boolean) => {
    try {
      setSaving(true)
      const updatedPermissions = {
        ...rolePermissions[role],
        [permissionName]: isActive
      }

      const response = await fetch(`/api/permissions/${role}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions })
      })

      if (response.ok) {
        setRolePermissions(prev => ({
          ...prev,
          [role]: updatedPermissions
        }))
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour des permissions')
    } finally {
      setSaving(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return 'Administrateur'
      case 'Planner': return 'Planificateur'
      case 'Chauffeur': return 'Chauffeur'
      default: return role
    }
  }

  const getModuleLabel = (module: string) => {
    switch (module) {
      case 'users': return 'Effectifs'
      case 'vehicles': return 'Véhicules'
      case 'courses': return 'Courses'
      case 'clients': return 'Clients'
      case 'analytics': return 'Dashboard'
      case 'settings': return 'Paramètres'
      case 'permissions': return 'Permissions'
      case 'calendar': return 'Calendrier'
      default: return module
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Créer'
      case 'read': return 'Consulter'
      case 'update': return 'Modifier'
      case 'delete': return 'Supprimer'
      case 'assign': return 'Assigner'
      case 'manage': return 'Gérer'
      case 'export': return 'Exporter'
      default: return action
    }
  }

  const getPermissionDescription = (permissionName: string) => {
    switch (permissionName) {
      case 'calendar.export': return 'Permet aux chauffeurs d\'exporter leur planning au format ICS pour leurs applications calendrier'
      case 'users.read': return 'Accès en lecture à la liste des utilisateurs'
      case 'users.create': return 'Autorisation pour créer de nouveaux utilisateurs'
      case 'users.update': return 'Autorisation pour modifier les informations des utilisateurs'
      case 'users.delete': return 'Autorisation pour supprimer des utilisateurs'
      case 'vehicles.read': return 'Accès en lecture à la liste des véhicules'
      case 'vehicles.create': return 'Autorisation pour ajouter de nouveaux véhicules'
      case 'vehicles.update': return 'Autorisation pour modifier les informations des véhicules'
      case 'vehicles.delete': return 'Autorisation pour supprimer des véhicules'
      case 'courses.read': return 'Accès en lecture à la liste des courses'
      case 'courses.create': return 'Autorisation pour créer de nouvelles courses'
      case 'courses.update': return 'Autorisation pour modifier les courses'
      case 'courses.delete': return 'Autorisation pour supprimer des courses'
      case 'courses.assign': return 'Autorisation pour assigner des courses aux chauffeurs'
      case 'clients.read': return 'Accès en lecture à la liste des clients'
      case 'clients.create': return 'Autorisation pour ajouter de nouveaux clients'
      case 'clients.update': return 'Autorisation pour modifier les informations des clients'
      case 'clients.delete': return 'Autorisation pour supprimer des clients'
      case 'analytics.read': return 'Accès aux tableaux de bord et statistiques'
      default: return null
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des permissions...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Tableau comparatif des permissions
          </CardTitle>
          <CardDescription>
            Comparez et configurez les droits d'accès pour les rôles Planner et Chauffeur.
            <br />
            <strong>Note :</strong> Les Administrateurs ont tous les droits par défaut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Module / Action</TableHead>
                  <TableHead className="text-center font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4" />
                      Planner
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <User className="h-4 w-4" />
                      Chauffeur
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(permissions).map(([module, modulePermissions]: [string, any]) => (
                  <React.Fragment key={module}>
                    {/* En-tête du module */}
                    <TableRow className="bg-gray-25">
                      <TableCell colSpan={3} className="font-medium text-sm bg-gray-100 text-gray-700">
                        <div className="flex items-center gap-2">
                          {module === 'users' && <Users className="h-4 w-4" />}
                          {module === 'vehicles' && <Car className="h-4 w-4" />}
                          {module === 'courses' && <Calendar className="h-4 w-4" />}
                          {module === 'clients' && <User className="h-4 w-4" />}
                          {module === 'analytics' && <FileText className="h-4 w-4" />}
                          {module === 'settings' && <Settings className="h-4 w-4" />}
                          {module === 'permissions' && <Shield className="h-4 w-4" />}
                          {module === 'calendar' && <Calendar className="h-4 w-4" />}
                          {getModuleLabel(module)}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Permissions du module */}
                    {modulePermissions.map((permission: any) => {
                      const plannerActive = rolePermissions['Planner']?.[permission.nom] || false
                      const chauffeurActive = rolePermissions['Chauffeur']?.[permission.nom] || false
                      const description = getPermissionDescription(permission.nom)
                      
                      return (
                        <TableRow key={permission.nom} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {getActionLabel(permission.action)}
                              </span>
                              {description && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p className="text-sm">{description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Colonne Planner */}
                          <TableCell className="text-center">
                            <Switch
                              checked={plannerActive}
                              onCheckedChange={(checked) => 
                                updateRolePermissions('Planner', permission.nom, checked)
                              }
                              disabled={saving}
                              className="mx-auto"
                            />
                          </TableCell>
                          
                          {/* Colonne Chauffeur */}
                          <TableCell className="text-center">
                            <Switch
                              checked={chauffeurActive}
                              onCheckedChange={(checked) => 
                                updateRolePermissions('Chauffeur', permission.nom, checked)
                              }
                              disabled={saving}
                              className="mx-auto"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}