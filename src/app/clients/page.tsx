"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react'

interface Client {
  id: string
  nom: string
  prenom: string
  telephone: string
  email: string | null
  adresses: any
  createdAt: string
  _count: {
    courses: number
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresses: ''
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          adresses: formData.adresses ? [formData.adresses] : null
        }),
      })

      if (response.ok) {
        resetForm()
        fetchClients()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client:', error)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email || '',
      adresses: Array.isArray(client.adresses) && client.adresses.length > 0 ? client.adresses[0] : ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          fetchClients()
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({ nom: '', prenom: '', telephone: '', email: '', adresses: '' })
    setEditingClient(null)
    setIsDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        </div>
        <div>Chargement...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm()
          setIsDialogOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Modifier le client' : 'Nouveau client'}
              </DialogTitle>
              <DialogDescription>
                {editingClient 
                  ? 'Modifiez les informations du client.'
                  : 'Ajouter un nouveau client à votre base de données.'
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresses">Adresse principale</Label>
                <Input
                  id="adresses"
                  value={formData.adresses}
                  onChange={(e) => setFormData({ ...formData, adresses: e.target.value })}
                  placeholder="123 rue de la Paix, Paris"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingClient ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            Gérez votre base de clients et consultez leurs informations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Membre depuis</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.prenom} {client.nom}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="mr-2 h-3 w-3" />
                        {client.telephone}
                      </div>
                      {client.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-2 h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                      {client.adresses && Array.isArray(client.adresses) && client.adresses.length > 0 && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="mr-2 h-3 w-3" />
                          {client.adresses[0]}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {client._count.courses} courses
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {clients.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              Aucun client enregistré. Ajoutez votre premier client !
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}