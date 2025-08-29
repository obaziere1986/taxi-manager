"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, Car, MapPin, Calendar, User, Check, AlertCircle } from "lucide-react"

interface CourseDetails {
  id: string
  origine: string
  destination: string
  date: string
  prix?: number
  client: {
    nom: string
    prenom: string
    email?: string
  }
  chauffeur: {
    nom: string
    prenom: string
  }
}

interface ReviewData {
  completed: boolean
  course: CourseDetails
  review?: {
    note: number
    commentaire?: string
    completed_at: string
  }
}

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('')
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // États du formulaire
  const [note, setNote] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [clientNom, setClientNom] = useState('')
  const [clientPrenom, setClientPrenom] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setToken(resolvedParams.token)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (token) {
      fetchReviewData()
    }
  }, [token])

  const fetchReviewData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/avis/submit?token=${token}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Lien invalide ou expiré')
        } else {
          setError('Erreur lors du chargement')
        }
        return
      }

      const data: ReviewData = await response.json()
      setReviewData(data)
      
      // Pré-remplir les champs client si disponibles
      if (data.course.client) {
        setClientNom(data.course.client.nom)
        setClientPrenom(data.course.client.prenom)
        setClientEmail(data.course.client.email || '')
      }

    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (note === 0) {
      setError('Veuillez donner une note de 1 à 5 étoiles')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/avis/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          note,
          commentaire: commentaire.trim() || undefined,
          client_nom: clientNom.trim() || undefined,
          client_prenom: clientPrenom.trim() || undefined,
          client_email: clientEmail.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la soumission')
        return
      }

      setSuccess(true)
      
    } catch (error) {
      console.error('Erreur soumission:', error)
      setError('Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      const filled = interactive 
        ? (hoveredStar > 0 ? starValue <= hoveredStar : starValue <= note)
        : starValue <= (reviewData?.review?.note || 0)

      return (
        <Star
          key={i}
          className={`w-8 h-8 cursor-pointer transition-colors ${
            filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
          }`}
          onClick={interactive ? () => setNote(starValue) : undefined}
          onMouseEnter={interactive ? () => setHoveredStar(starValue) : undefined}
          onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
        />
      )
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Lien invalide</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success || reviewData?.completed) {
    const review = reviewData?.review
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              {success ? 'Merci pour votre avis !' : 'Avis déjà soumis'}
            </CardTitle>
            <CardDescription>
              {success 
                ? 'Votre retour nous aide à améliorer notre service.'
                : 'Vous avez déjà donné votre avis pour cette course.'
              }
            </CardDescription>
          </CardHeader>
          
          {reviewData && (
            <CardContent className="space-y-6">
              {/* Course details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Détails de la course
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {reviewData.course.origine} → {reviewData.course.destination}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(reviewData.course.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Chauffeur: {reviewData.course.chauffeur.prenom} {reviewData.course.chauffeur.nom}
                  </div>
                </div>
              </div>

              {/* Review given */}
              {review && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Votre évaluation</h3>
                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(false)}
                      <span className="text-sm text-gray-600">({review.note}/5)</span>
                    </div>
                    {review.commentaire && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm italic">"{review.commentaire}"</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Soumis le {formatDate(review.completed_at)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Évaluez votre course</CardTitle>
          <CardDescription>
            Votre avis nous aide à améliorer notre service
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Course details */}
          {reviewData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Détails de la course
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {reviewData.course.origine} → {reviewData.course.destination}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(reviewData.course.date)}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Chauffeur: {reviewData.course.chauffeur.prenom} {reviewData.course.chauffeur.nom}
                </div>
                {reviewData.course.prix && (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-center text-xs">€</span>
                    Prix: {reviewData.course.prix}€
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Review form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Note globale *</Label>
              <div className="flex items-center gap-2">
                {renderStars(true)}
                <span className="text-sm text-gray-600 ml-2">
                  {note > 0 ? `(${note}/5)` : 'Cliquez pour noter'}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
              <Textarea
                id="commentaire"
                placeholder="Partagez votre expérience..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
              />
            </div>

            {/* Client info (optional update) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Vos informations (optionnel)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={clientPrenom}
                    onChange={(e) => setClientPrenom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={clientNom}
                    onChange={(e) => setClientNom(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}