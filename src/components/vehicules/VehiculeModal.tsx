"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { Car, User, ArrowRight, History } from 'lucide-react'
import { getDefaultBadge, getAssignationBadge } from '@/lib/badge-utils'

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
}

interface VehiculeAssignation {
  id: string
  dateDebut: string
  dateFin?: string
  actif: boolean
  notes?: string
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

interface VehiculeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (vehicule: Vehicule) => Promise<void>
  vehicule?: Vehicule | null
  mode: 'create' | 'edit'
}

export function VehiculeModal({ isOpen, onClose, onSave, vehicule, mode }: VehiculeModalProps) {
  const [activeTab, setActiveTab] = useState('caracteristiques')
  const [assignations, setAssignations] = useState<VehiculeAssignation[]>([])
  const [loadingAssignations, setLoadingAssignations] = useState(false)
  const [formData, setFormData] = useState<Partial<Vehicule>>({
    marque: '',
    modele: '',
    immatriculation: '',
    couleur: '',
    annee: new Date().getFullYear(),
    actif: true,
    kilometrage: 0,
    carburant: 'ESSENCE',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && vehicule) {
      setFormData({
        ...vehicule,
        prochaineVidange: vehicule.prochaineVidange ? vehicule.prochaineVidange.split('T')[0] : '',
        prochainEntretien: vehicule.prochainEntretien ? vehicule.prochainEntretien.split('T')[0] : '',
        prochainControleTechnique: vehicule.prochainControleTechnique ? vehicule.prochainControleTechnique.split('T')[0] : ''
      })
      // Charger les assignations pour ce véhicule
      fetchVehiculeAssignations(vehicule.id)
    } else if (mode === 'create') {
      setFormData({
        marque: '',
        modele: '',
        immatriculation: '',
        couleur: '',
        annee: new Date().getFullYear(),
        actif: true,
        kilometrage: 0,
        carburant: 'ESSENCE',
        notes: ''
      })
      setAssignations([])
    }
  }, [mode, vehicule, isOpen])

  const fetchVehiculeAssignations = async (vehiculeId: string) => {
    try {
      setLoadingAssignations(true)
      const response = await fetch(`/api/vehicules/assignations/robust?vehiculeId=${vehiculeId}`)
      const data = await response.json()
      
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setAssignations(data)
      } else {
        console.error('Les assignations ne sont pas un tableau:', data)
        setAssignations([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des assignations:', error)
      setAssignations([])
    } finally {
      setLoadingAssignations(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.marque || !formData.modele || !formData.immatriculation) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      // Convertir les dates ISO pour l'API
      const vehiculeData = {
        ...formData,
        prochaineVidange: formData.prochaineVidange ? new Date(formData.prochaineVidange).toISOString() : undefined,
        prochainEntretien: formData.prochainEntretien ? new Date(formData.prochainEntretien).toISOString() : undefined,
        prochainControleTechnique: formData.prochainControleTechnique ? new Date(formData.prochainControleTechnique).toISOString() : undefined,
      } as Vehicule

      await onSave(vehiculeData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde du véhicule')
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return ''
    return format(new Date(dateStr), 'yyyy-MM-dd')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouveau véhicule' : `${formData.marque} ${formData.modele}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Ajoutez un nouveau véhicule au parc automobile.'
              : `Gestion du véhicule ${formData.immatriculation}`
            }
          </DialogDescription>
        </DialogHeader>

        {mode === 'create' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Informations générales</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marque">Marque *</Label>
                <Input
                  id="marque"
                  value={formData.marque || ''}
                  onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                  placeholder="Peugeot, Renault..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modele">Modèle *</Label>
                <Input
                  id="modele"
                  value={formData.modele || ''}
                  onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                  placeholder="508, Clio..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="immatriculation">Immatriculation *</Label>
                <Input
                  id="immatriculation"
                  value={formData.immatriculation || ''}
                  onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
                  placeholder="AB-123-CD"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="couleur">Couleur</Label>
                <Input
                  id="couleur"
                  value={formData.couleur || ''}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  placeholder="Gris métallisé"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  value={formData.annee || ''}
                  onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) || undefined })}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kilometrage">Kilométrage</Label>
                <Input
                  id="kilometrage"
                  type="number"
                  value={formData.kilometrage || ''}
                  onChange={(e) => setFormData({ ...formData, kilometrage: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="carburant">Carburant</Label>
                <Select value={formData.carburant || 'ESSENCE'} onValueChange={(value) => setFormData({ ...formData, carburant: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESSENCE">Essence</SelectItem>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="HYBRIDE">Hybride</SelectItem>
                    <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Prochaines dates d'entretien */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Prochaines échéances d'entretien</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prochaineVidange">Vidange</Label>
                <Input
                  id="prochaineVidange"
                  type="date"
                  value={formData.prochaineVidange || ''}
                  onChange={(e) => setFormData({ ...formData, prochaineVidange: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prochainEntretien">Entretien</Label>
                <Input
                  id="prochainEntretien"
                  type="date"
                  value={formData.prochainEntretien || ''}
                  onChange={(e) => setFormData({ ...formData, prochainEntretien: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prochainControleTechnique">Contrôle technique</Label>
                <Input
                  id="prochainControleTechnique"
                  type="date"
                  value={formData.prochainControleTechnique || ''}
                  onChange={(e) => setFormData({ ...formData, prochainControleTechnique: e.target.value })}
                />
              </div>
            </div>

          </div>

          {/* Notes et statut */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="actif"
                checked={formData.actif || false}
                onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
              />
              <Label htmlFor="actif">Véhicule actif</Label>
            </div>
          </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sauvegarde...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="caracteristiques" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Caractéristiques
              </TabsTrigger>
              <TabsTrigger value="historique" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique assignations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="caracteristiques">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de base */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Informations générales</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marque">Marque *</Label>
                      <Input
                        id="marque"
                        value={formData.marque || ''}
                        onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                        placeholder="Peugeot, Renault..."
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="modele">Modèle *</Label>
                      <Input
                        id="modele"
                        value={formData.modele || ''}
                        onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                        placeholder="508, Clio..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="immatriculation">Immatriculation *</Label>
                      <Input
                        id="immatriculation"
                        value={formData.immatriculation || ''}
                        onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
                        placeholder="AB-123-CD"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="couleur">Couleur</Label>
                      <Input
                        id="couleur"
                        value={formData.couleur || ''}
                        onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                        placeholder="Gris métallisé"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annee">Année</Label>
                      <Input
                        id="annee"
                        type="number"
                        value={formData.annee || ''}
                        onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) || undefined })}
                        min="1990"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kilometrage">Kilométrage</Label>
                      <Input
                        id="kilometrage"
                        type="number"
                        value={formData.kilometrage || ''}
                        onChange={(e) => setFormData({ ...formData, kilometrage: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="carburant">Carburant</Label>
                      <Select value={formData.carburant || 'ESSENCE'} onValueChange={(value) => setFormData({ ...formData, carburant: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ESSENCE">Essence</SelectItem>
                          <SelectItem value="DIESEL">Diesel</SelectItem>
                          <SelectItem value="HYBRIDE">Hybride</SelectItem>
                          <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Prochaines dates d'entretien */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Prochaines échéances d'entretien</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prochaineVidange">Vidange</Label>
                      <Input
                        id="prochaineVidange"
                        type="date"
                        value={formData.prochaineVidange || ''}
                        onChange={(e) => setFormData({ ...formData, prochaineVidange: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prochainEntretien">Entretien</Label>
                      <Input
                        id="prochainEntretien"
                        type="date"
                        value={formData.prochainEntretien || ''}
                        onChange={(e) => setFormData({ ...formData, prochainEntretien: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prochainControleTechnique">Contrôle technique</Label>
                      <Input
                        id="prochainControleTechnique"
                        type="date"
                        value={formData.prochainControleTechnique || ''}
                        onChange={(e) => setFormData({ ...formData, prochainControleTechnique: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes et statut */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informations complémentaires..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="actif"
                      checked={formData.actif || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                    />
                    <Label htmlFor="actif">Véhicule actif</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Sauvegarde...' : 'Modifier'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="historique">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Historique des assignations
                  </h4>
                  <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                    {assignations.length} assignation{assignations.length > 1 ? 's' : ''}
                  </Badge>
                </div>

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
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {assignations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucune assignation pour ce véhicule</p>
                      </div>
                    ) : (
                      assignations.map((assignation) => (
                        <div key={assignation.id} className="border rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-green-500" />
                                <span className="font-medium">
                                  {assignation.chauffeur ? 
                                    `${assignation.chauffeur.nom.toUpperCase()}, ${assignation.chauffeur.prenom}` :
                                    `${assignation.user.nom.toUpperCase()}, ${assignation.user.prenom}`
                                  }
                                </span>
                                <Badge variant="secondary" className="text-xs font-medium px-2 py-1 ml-2">
                                  {assignation.chauffeur ? 'Chauffeur' : assignation.user?.role}
                                </Badge>
                              </div>
                              
                              <Badge 
                                variant={assignation.actif ? 'default' : 'secondary'} 
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
                      ))
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Fermer
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}