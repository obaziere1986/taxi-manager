"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Mail, Send, Settings, TestTube, History, AlertCircle, CheckCircle, Bell, MessageSquare, Phone } from "lucide-react"

interface MailTest {
  email: string;
  loading: boolean;
}

interface SmtpConfig {
  host: string;
  port: string;
  user: string;
  secure: boolean;
}

export default function MailSettings() {
  const [mailTest, setMailTest] = useState<MailTest>({ email: '', loading: false })
  const [smtpStatus, setSmtpStatus] = useState<'checking' | 'success' | 'error' | 'idle'>('idle')
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(null)
  const [customTemplate, setCustomTemplate] = useState({ subject: '', content: '', to: '' })
  const [sendingCustom, setSendingCustom] = useState(false)

  // Vérifier la configuration SMTP au chargement
  useEffect(() => {
    checkSmtpConnection()
  }, [])

  const checkSmtpConnection = async () => {
    setSmtpStatus('checking')
    try {
      const response = await fetch('/api/mail/test')
      const result = await response.json()
      
      if (result.success) {
        setSmtpStatus('success')
        setSmtpConfig(result.config)
        toast.success('Configuration SMTP vérifiée')
      } else {
        setSmtpStatus('error')
        toast.error('Erreur de configuration SMTP')
      }
    } catch (error) {
      setSmtpStatus('error')
      toast.error('Impossible de vérifier la configuration')
    }
  }

  const sendTestEmail = async () => {
    if (!mailTest.email.trim()) {
      toast.error('Veuillez saisir une adresse email')
      return
    }

    setMailTest(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch('/api/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: mailTest.email })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Email de test envoyé à ${mailTest.email}`)
        setMailTest({ email: '', loading: false })
      } else {
        toast.error('Échec de l\'envoi du test')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setMailTest(prev => ({ ...prev, loading: false }))
    }
  }

  const sendCustomEmail = async () => {
    if (!customTemplate.to.trim() || !customTemplate.subject.trim() || !customTemplate.content.trim()) {
      toast.error('Tous les champs sont requis')
      return
    }

    setSendingCustom(true)
    
    try {
      const response = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          to: customTemplate.to,
          customSubject: customTemplate.subject,
          customContent: customTemplate.content
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success(`Email personnalisé envoyé à ${customTemplate.to}`)
        setCustomTemplate({ subject: '', content: '', to: '' })
      } else {
        toast.error(result.error || 'Échec de l\'envoi')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSendingCustom(false)
    }
  }

  const getStatusIcon = () => {
    switch (smtpStatus) {
      case 'checking':
        return <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Settings className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    switch (smtpStatus) {
      case 'checking':
        return <Badge variant="outline" className="animate-pulse">Vérification...</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Configuré</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  return (
    <div className="space-y-6">

      {/* Status SMTP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications & Communications
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Configuration SMTP et gestion des communications
            {getStatusBadge()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {smtpConfig && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="font-medium text-gray-600">Serveur</Label>
                <p className="font-mono">{smtpConfig.host}</p>
              </div>
              <div>
                <Label className="font-medium text-gray-600">Port</Label>
                <p className="font-mono">{smtpConfig.port}</p>
              </div>
              <div>
                <Label className="font-medium text-gray-600">Utilisateur</Label>
                <p className="font-mono">{smtpConfig.user}</p>
              </div>
              <div>
                <Label className="font-medium text-gray-600">Sécurisé</Label>
                <p className="font-mono">{smtpConfig.secure ? 'SSL' : 'TLS'}</p>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={checkSmtpConnection}
            disabled={smtpStatus === 'checking'}
          >
            <Settings className="w-4 h-4 mr-2" />
            Revérifier la connexion
          </Button>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Tests
          </TabsTrigger>
        </TabsList>

        {/* Onglet Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Email</CardTitle>
              <CardDescription>
                Gestion des notifications par email et templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Notifications automatiques */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notifications automatiques</h4>
                    <p className="text-sm text-muted-foreground">Envoyer des emails automatiques</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                {/* Types de notifications */}
                <div className="ml-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <label className="text-sm">Bienvenue nouveaux utilisateurs</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <label className="text-sm">Assignation de course</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <label className="text-sm">Rappels avant course (1h et 30min)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <label className="text-sm">Confirmation course terminée</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <label className="text-sm">Course annulée</label>
                  </div>
                </div>

                {/* Rapports */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Rapports périodiques</h4>
                      <p className="text-sm text-muted-foreground">Envoi de rapports automatiques</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="ml-6 space-y-3 mt-3">
                    <div className="flex items-center space-x-2">
                      <Switch />
                      <label className="text-sm">Rapport quotidien d'activité</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch />
                      <label className="text-sm">Alertes véhicules (entretien, contrôle technique)</label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet SMS */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>Configuration SMS</CardTitle>
              <CardDescription>
                Gestion des notifications par SMS (fonctionnalité à venir)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* État SMS */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notifications SMS</h4>
                    <p className="text-sm text-muted-foreground">Envoyer des SMS automatiques aux clients</p>
                  </div>
                  <Switch disabled />
                </div>
                
                {/* Types de SMS */}
                <div className="ml-6 space-y-3 opacity-50">
                  <div className="flex items-center space-x-2">
                    <Switch disabled />
                    <label className="text-sm">Confirmation de réservation</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch disabled />
                    <label className="text-sm">Arrivée du chauffeur (5 min avant)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch disabled />
                    <label className="text-sm">Récapitulatif fin de course</label>
                  </div>
                </div>

                {/* Message d'information */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-600" />
                    <h4 className="font-medium text-amber-800">Fonctionnalité en développement</h4>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    Le système de notifications SMS sera disponible dans une prochaine version. 
                    Concentrez-vous sur les emails pour l'instant.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Test */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test de configuration</CardTitle>
              <CardDescription>
                Envoyez un email de test pour vérifier que le système fonctionne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Adresse de destination</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="votre-email@exemple.com"
                  value={mailTest.email}
                  onChange={(e) => setMailTest(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <Button
                onClick={sendTestEmail}
                disabled={mailTest.loading || smtpStatus !== 'success'}
                className="w-full"
              >
                {mailTest.loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Envoi en cours...
                  </div>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Envoyer un test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Types de mails automatiques */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications automatiques</CardTitle>
          <CardDescription>
            Types de mails envoyés automatiquement par le système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {[
              { type: 'Bienvenue', desc: 'Envoyé lors de la création d\'un nouvel utilisateur', active: true },
              { type: 'Assignation', desc: 'Envoyé quand une course est assignée à un chauffeur', active: true },
              { type: 'Rappel 1h', desc: 'Rappel envoyé 1 heure avant une course', active: true },
              { type: 'Rappel 30min', desc: 'Rappel envoyé 30 minutes avant une course', active: true },
              { type: 'Confirmation', desc: 'Envoyé quand une course est marquée comme terminée', active: false },
              { type: 'Annulation', desc: 'Envoyé quand une course est annulée', active: false },
            ].map((item) => (
              <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{item.type}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                <Switch checked={item.active} disabled />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}