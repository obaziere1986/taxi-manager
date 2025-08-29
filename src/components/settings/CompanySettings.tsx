"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, Loader2 } from "lucide-react"
import { useSettings } from '@/hooks/useSettings'
// Toast hook temporairement remplacé par alert

export function CompanySettings() {
  const { settings, loading, error, updateSettings } = useSettings()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    company_phone: '',
    company_email: '',
    company_address: '',
    opening_hours: '00:00',
    closing_hours: '23:00',
    base_fare: 4.20,
    price_per_km_day: 1.15,
    price_per_km_night: 1.50,
    night_start_time: '20:00',
    night_end_time: '07:00',
    average_trip_duration: 45,
    max_distance_km: 100,
    timezone: 'Europe/Paris',
    currency: 'EUR',
    language: 'fr-FR'
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_address: settings.company_address || '',
        opening_hours: settings.opening_hours?.substring(0, 5) || '00:00',
        closing_hours: settings.closing_hours?.substring(0, 5) || '23:00',
        base_fare: settings.base_fare || 4.20,
        price_per_km_day: settings.price_per_km_day || 1.15,
        price_per_km_night: settings.price_per_km_night || 1.50,
        night_start_time: settings.night_start_time?.substring(0, 5) || '20:00',
        night_end_time: settings.night_end_time?.substring(0, 5) || '07:00',
        average_trip_duration: settings.average_trip_duration || 45,
        max_distance_km: settings.max_distance_km || 100,
        timezone: settings.timezone || 'Europe/Paris',
        currency: settings.currency || 'EUR',
        language: settings.language || 'fr-FR'
      })
    }
  }, [settings])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateSettings(formData)
      if (success) {
        alert("Paramètres mis à jour avec succès!")
      } else {
        alert("Erreur lors de la sauvegarde des paramètres")
      }
    } catch (error) {
      alert("Impossible de sauvegarder les paramètres. Veuillez réessayer.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>Erreur lors du chargement: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Informations de l'entreprise
        </CardTitle>
        <CardDescription>
          Identité et coordonnées de votre société de taxi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations de base */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Informations de base</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nom de la société *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Nom de votre entreprise"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_phone">Téléphone principal</Label>
              <Input
                id="company_phone"
                value={formData.company_phone}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
                placeholder="01.23.45.67.89"
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_email">Email de contact</Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                placeholder="contact@votre-entreprise.fr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Europe/Brussels">Europe/Brussels (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_address">Adresse</Label>
            <Textarea
              id="company_address"
              value={formData.company_address}
              onChange={(e) => handleInputChange('company_address', e.target.value)}
              placeholder="Adresse complète de votre entreprise"
              rows={2}
            />
          </div>
        </div>

        {/* Horaires */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Horaires de service</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opening_hours">Ouverture</Label>
              <Input
                id="opening_hours"
                type="time"
                value={formData.opening_hours}
                onChange={(e) => handleInputChange('opening_hours', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing_hours">Fermeture</Label>
              <Input
                id="closing_hours"
                type="time"
                value={formData.closing_hours}
                onChange={(e) => handleInputChange('closing_hours', e.target.value)}
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}