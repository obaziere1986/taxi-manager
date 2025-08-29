"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Star, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send,
  AlertCircle,
  BarChart3,
  Users,
  MessageSquare,
  Settings,
  TestTube,
  Edit,
  Play,
  Power
} from "lucide-react"

interface Review {
  id: string
  course_id: string
  client_nom: string
  client_prenom: string
  client_email: string
  chauffeur_nom: string
  chauffeur_prenom: string
  note?: number
  commentaire?: string
  email_sent_at?: string
  reminder_sent_at?: string
  completed_at?: string
  review_token: string
  course_origine: string
  course_destination: string
  course_date: string
}

interface Stats {
  total_reviews: number
  completed_reviews: number
  pending_reviews: number
  avg_rating: number
  emails_sent: number
  reminders_sent: number
}

interface ReviewSettings {
  reviews_enabled: boolean
  reviews_auto_send: boolean
}

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [settings, setSettings] = useState<ReviewSettings>({ reviews_enabled: true, reviews_auto_send: true })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  
  // États pour l'éditeur de templates
  const [selectedTemplate, setSelectedTemplate] = useState('client_course_completed_with_review')
  const [templateData, setTemplateData] = useState<any>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  
  // États pour les tests
  const [testData, setTestData] = useState({
    origine: 'Gare Saint-Lazare',
    destination: 'Aéroport Charles de Gaulle',
    clientNom: 'DUPONT',
    clientPrenom: 'Marie',
    email: '',
    chauffeurNom: 'MARTIN',
    chauffeurPrenom: 'Jean',
    templateType: 'completed_with_review'
  })
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    fetchReviews()
    fetchStats()
    fetchSettings()
    fetchTemplate()
  }, [])

  useEffect(() => {
    fetchTemplate()
  }, [selectedTemplate])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error)
      toast.error('Impossible de charger les avis')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reviews/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/reviews/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<ReviewSettings>) => {
    setSavingSettings(true)
    try {
      const response = await fetch('/api/reviews/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      
      if (response.ok) {
        setSettings(prev => ({ ...prev, ...newSettings }))
        toast.success('Paramètres sauvegardés')
      } else {
        toast.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingSettings(false)
    }
  }

  const fetchTemplate = async () => {
    setLoadingTemplate(true)
    try {
      const response = await fetch(`/api/mail/templates?type=${selectedTemplate}`)
      if (response.ok) {
        const data = await response.json()
        setTemplateData(data)
      }
    } catch (error) {
      console.error('Erreur chargement template:', error)
    } finally {
      setLoadingTemplate(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testData.email) {
      toast.error('Veuillez saisir une adresse email')
      return
    }

    setSendingTest(true)
    try {
      const response = await fetch('/api/mail/test-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testData.email,
          templateType: testData.templateType,
          courseData: {
            origine: testData.origine,
            destination: testData.destination
          },
          clientData: {
            nom: testData.clientNom,
            prenom: testData.clientPrenom
          },
          chauffeurData: {
            nom: testData.chauffeurNom,
            prenom: testData.chauffeurPrenom
          }
        })
      })
      
      if (response.ok) {
        toast.success(`Email de test envoyé à ${testData.email}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur test email:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSendingTest(false)
    }
  }

  const sendReminder = async (reviewId: string) => {
    setSending(reviewId)
    try {
      const response = await fetch(`/api/reviews/${reviewId}/remind`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Rappel envoyé avec succès')
        fetchReviews() // Refresh pour mettre à jour reminder_sent_at
      } else {
        toast.error('Échec de l\'envoi du rappel')
      }
    } catch (error) {
      console.error('Erreur rappel:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSending(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (review: Review) => {
    if (review.completed_at) {
      return <Badge className="bg-green-100 text-green-800">Complété</Badge>
    }
    if (review.reminder_sent_at) {
      return <Badge variant="secondary">Rappel envoyé</Badge>
    }
    if (review.email_sent_at) {
      return <Badge variant="outline">Email envoyé</Badge>
    }
    return <Badge variant="destructive">En attente</Badge>
  }

  const getRatingDisplay = (note?: number) => {
    if (!note) return <span className="text-gray-400">Pas encore évalué</span>
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < note ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 font-medium">{note}/5</span>
      </div>
    )
  }

  const completedReviews = reviews.filter(r => r.completed_at)
  const pendingReviews = reviews.filter(r => !r.completed_at)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Paramètres globaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration du système d'avis
          </CardTitle>
          <CardDescription>
            Paramètres pour gérer les demandes d'avis clients automatiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Système d'avis activé</Label>
              <p className="text-sm text-muted-foreground">
                Désactiver complètement les demandes d'avis clients
              </p>
            </div>
            <Switch
              checked={settings.reviews_enabled}
              onCheckedChange={(checked) => updateSettings({ reviews_enabled: checked })}
              disabled={savingSettings}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Envoi automatique</Label>
              <p className="text-sm text-muted-foreground">
                Envoyer automatiquement les demandes d'avis à la fin des courses
              </p>
            </div>
            <Switch
              checked={settings.reviews_auto_send}
              onCheckedChange={(checked) => updateSettings({ reviews_auto_send: checked })}
              disabled={savingSettings || !settings.reviews_enabled}
            />
          </div>

          {!settings.reviews_enabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h4 className="font-medium text-amber-800">Système désactivé</h4>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Les avis clients ne seront plus demandés automatiquement. 
                Approprié pour les transports sensibles (hôpital, etc.)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total_reviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Complétés</p>
                  <p className="text-2xl font-bold">{stats.completed_reviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">{stats.pending_reviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                  <p className="text-2xl font-bold">{stats.avg_rating?.toFixed(1) || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Emails</p>
                  <p className="text-2xl font-bold">{stats.emails_sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Rappels</p>
                  <p className="text-2xl font-bold">{stats.reminders_sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            En attente ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Complétés ({completedReviews.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Templates & Tests
          </TabsTrigger>
        </TabsList>

        {/* Avis en attente */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Avis en attente de réception</CardTitle>
              <CardDescription>
                Courses terminées attendant un avis client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun avis en attente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReviews.map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">
                            {review.client_prenom} {review.client_nom}
                          </h4>
                          {getStatusBadge(review)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {review.course_origine} → {review.course_destination}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          Chauffeur: {review.chauffeur_prenom} {review.chauffeur_nom}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Course du {formatDate(review.course_date)}
                        </p>
                        {review.email_sent_at && (
                          <p className="text-xs text-green-600 mt-2">
                            Email envoyé le {formatDate(review.email_sent_at)}
                          </p>
                        )}
                        {review.reminder_sent_at && (
                          <p className="text-xs text-orange-600 mt-1">
                            Rappel envoyé le {formatDate(review.reminder_sent_at)}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendReminder(review.id)}
                          disabled={sending === review.id}
                        >
                          {sending === review.id ? (
                            <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Rappel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avis complétés */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Avis reçus</CardTitle>
              <CardDescription>
                Retours clients sur les courses terminées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun avis reçu pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedReviews
                    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
                    .map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">
                            {review.client_prenom} {review.client_nom}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {review.course_origine} → {review.course_destination}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Chauffeur: {review.chauffeur_prenom} {review.chauffeur_nom}
                          </p>
                        </div>
                        <div className="text-right">
                          {getRatingDisplay(review.note)}
                          <p className="text-xs text-muted-foreground mt-1">
                            Reçu le {formatDate(review.completed_at!)}
                          </p>
                        </div>
                      </div>
                      
                      {review.commentaire && (
                        <div className="bg-gray-50 p-3 rounded-lg mt-3">
                          <p className="text-sm italic">"{review.commentaire}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates & Tests */}
        <TabsContent value="templates">
          <div className="space-y-6">
            
            {/* Editeur de templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Éditeur de templates d'emails
                </CardTitle>
                <CardDescription>
                  Personnalisez les modèles d'emails envoyés aux clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template à éditer</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_course_completed_with_review">
                          Fin de course avec demande d'avis
                        </SelectItem>
                        <SelectItem value="client_review_reminder">
                          Rappel de demande d'avis
                        </SelectItem>
                        <SelectItem value="client_driver_assigned">
                          Assignation de chauffeur
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Sujet</Label>
                        <input 
                          className="w-full p-2 border rounded-md"
                          value={templateData?.subject || 'Chargement...'}
                          disabled
                          placeholder="Sujet du template"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Contenu HTML</Label>
                        <textarea 
                          className="w-full p-3 border rounded-md font-mono text-sm"
                          rows={12}
                          value={templateData?.html || 'Chargement du template...'}
                          disabled
                          placeholder="Template HTML ici..."
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" disabled>
                          <Edit className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          Réinitialiser
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Aperçu du template</Label>
                        <div className="border rounded-md bg-gray-50 h-80 overflow-hidden">
                          {loadingTemplate ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                          ) : (
                            <div className="h-full bg-white">
                              {/* Aperçu simplifié du template */}
                              <div className="p-6 space-y-4 overflow-auto h-full">
                                <div className="text-center border-b pb-4">
                                  <div className="text-xl font-bold text-yellow-600 mb-2">🚕 Taxi Manager</div>
                                  <h3 className="text-lg font-medium">{templateData?.name || 'Template'}</h3>
                                </div>
                                
                                <div className="space-y-3 text-sm">
                                  <p><strong>Sujet :</strong> {templateData?.subject || 'Chargement...'}</p>
                                  
                                  <div className="bg-gray-50 p-3 rounded">
                                    <strong>Variables disponibles :</strong>
                                    <ul className="mt-1 text-xs space-y-1 text-gray-600">
                                      {templateData?.variables?.map((variable: string, index: number) => (
                                        <li key={index}>• {variable}</li>
                                      )) || <li>Chargement...</li>}
                                    </ul>
                                  </div>
                                  
                                  <div className="text-center py-4">
                                    <div className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg text-sm">
                                      🚕 Bouton d'action
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-gray-500 text-center">
                                    {templateData?.description || 'Description du template'}
                                  </p>
                                </div>
                                
                                <div className="border-t pt-4 mt-4">
                                  <p className="text-xs text-gray-400 text-center">
                                    💡 Tip: Utilisez l'onglet "Tests" pour voir le rendu complet
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tests d'emails */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Tests d'emails
                </CardTitle>
                <CardDescription>
                  Tester les emails d'avis sur des courses et clients fictifs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Mode Test</h4>
                    <p className="text-sm text-blue-700">
                      Les emails de test sont envoyés avec le préfixe [TEST] et ne créent pas d'entrées dans la base de données.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Course fictive</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Origine</Label>
                          <input 
                            className="w-full p-2 border rounded-md"
                            placeholder="123 Rue de Paris"
                            value={testData.origine}
                            onChange={(e) => setTestData(prev => ({ ...prev, origine: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Destination</Label>
                          <input 
                            className="w-full p-2 border rounded-md"
                            placeholder="Hôpital Saint-Louis"
                            value={testData.destination}
                            onChange={(e) => setTestData(prev => ({ ...prev, destination: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prénom client</Label>
                          <input 
                            className="w-full p-2 border rounded-md"
                            placeholder="Marie"
                            value={testData.clientPrenom}
                            onChange={(e) => setTestData(prev => ({ ...prev, clientPrenom: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nom client</Label>
                          <input 
                            className="w-full p-2 border rounded-md"
                            placeholder="DUPONT"
                            value={testData.clientNom}
                            onChange={(e) => setTestData(prev => ({ ...prev, clientNom: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Email de test</Label>
                        <input 
                          type="email"
                          className="w-full p-2 border rounded-md"
                          placeholder="votre-email@test.com"
                          value={testData.email}
                          onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Chauffeur test</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prénom chauffeur</Label>
                          <input 
                            className="w-full p-2 border rounded-md"
                            placeholder="Jean"
                            value={testData.chauffeurPrenom}
                            onChange={(e) => setTestData(prev => ({ ...prev, chauffeurPrenom: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nom chauffeur</Label>
                          <input 
                            className="w-full p-2 border rounded-md"
                            placeholder="MARTIN"
                            value={testData.chauffeurNom}
                            onChange={(e) => setTestData(prev => ({ ...prev, chauffeurNom: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Type d'email à tester</Label>
                        <Select value={testData.templateType} onValueChange={(value) => setTestData(prev => ({ ...prev, templateType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed_with_review">Fin de course + avis</SelectItem>
                            <SelectItem value="reminder">Rappel d'avis</SelectItem>
                            <SelectItem value="driver_assigned">Assignation chauffeur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={sendTestEmail}
                        disabled={sendingTest || !testData.email}
                      >
                        {sendingTest ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Envoyer email de test
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}