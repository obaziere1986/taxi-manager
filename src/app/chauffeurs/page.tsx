"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { Plus, Phone, Car, Edit, Trash2 } from 'lucide-react'
import { getUserStatusBadge, getDefaultBadge } from '@/lib/badge-utils'

interface Chauffeur {
  id: string
  nom: string
  prenom: string
  telephone: string
  vehicule: string
  statut: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  createdAt: string
  _count: {
    courses: number
  }
}

// Supprimé statutLabels - utilise maintenant getUserStatusBadge de badge-utils

export default function ChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChauffeur, setEditingChauffeur] = useState<Chauffeur | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    vehicule: '',
    statut: 'DISPONIBLE'
  })

  useEffect(() => {
    fetchChauffeurs()
  }, [])

  const fetchChauffeurs = async () => {
    try {
      const response = await fetch('/api/chauffeurs')
      const data = await response.json()
      setChauffeurs(data)
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingChauffeur ? `/api/chauffeurs/${editingChauffeur.id}` : '/api/chauffeurs'
      const method = editingChauffeur ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        resetForm()
        fetchChauffeurs()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const handleEdit = (chauffeur: Chauffeur) => {
    setEditingChauffeur(chauffeur)
    setFormData({
      nom: chauffeur.nom,
      prenom: chauffeur.prenom,
      telephone: chauffeur.telephone,
      vehicule: chauffeur.vehicule,
      statut: chauffeur.statut
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      try {
        const response = await fetch(`/api/chauffeurs/${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          fetchChauffeurs()
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({ nom: '', prenom: '', telephone: '', vehicule: '', statut: 'DISPONIBLE' })
    setEditingChauffeur(null)
    setIsDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <PageHeader title="Chauffeurs" />
        <div className="flex-1 p-6">
          <div>Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title="Chauffeurs">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm()
          setIsDialogOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau chauffeur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingChauffeur ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}
              </DialogTitle>
              <DialogDescription>
                {editingChauffeur 
                  ? 'Modifiez les informations du chauffeur.'
                  : 'Ajouter un nouveau chauffeur à votre équipe.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone *</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicule">Véhicule *</Label>
                <Input
                  id="vehicule"
                  value={formData.vehicule}
                  onChange={(e) => setFormData({ ...formData, vehicule: e.target.value })}
                  placeholder="Mercedes Classe E"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value) => setFormData({ ...formData, statut: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                    <SelectItem value="OCCUPE">Occupé</SelectItem>
                    <SelectItem value="HORS_SERVICE">Hors service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingChauffeur ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 p-6 space-y-4">
        <Card>
        <CardHeader>
          <CardTitle>Équipe de chauffeurs</CardTitle>
          <CardDescription>
            Gérez votre équipe et suivez leur statut en temps réel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chauffeurs.map((chauffeur) => (
                <TableRow key={chauffeur.id}>
                  <TableCell className="font-medium">{chauffeur.prenom} {chauffeur.nom.toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-3 w-3" />
                      {chauffeur.telephone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Car className="mr-2 h-3 w-3" />
                      {chauffeur.vehicule}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge 
                        variant={getUserStatusBadge(chauffeur.statut).variant}
                        className={getUserStatusBadge(chauffeur.statut).className}
                      >
                        {chauffeur.statut === 'DISPONIBLE' ? 'Disponible' : 
                         chauffeur.statut === 'OCCUPE' ? 'Occupé' :
                         chauffeur.statut === 'HORS_SERVICE' ? 'Hors service' : chauffeur.statut}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                      {chauffeur._count.courses} courses
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(chauffeur)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(chauffeur.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {chauffeurs.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              Aucun chauffeur enregistré. Ajoutez votre premier chauffeur !
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}