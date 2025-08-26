"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  Info
} from "lucide-react"

interface Permission {
  id: string
  nom: string
  description: string
  enabled: boolean
}

export function CalendarPreferences() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [permissionsRes, rolePermissionsRes] = await Promise.all([
        fetch('/api/permissions'),
        fetch('/api/permissions/check?permission=calendar.export&role=Chauffeur')
      ])

      const permissionsResponse = await permissionsRes.json()
      
      let rolePermissionsData = { hasPermission: false }
      try {
        if (rolePermissionsRes.ok) {
          rolePermissionsData = await rolePermissionsRes.json()
        }
      } catch (error) {
        console.warn('Erreur lors du parsing des permissions:', error)
      }

      // L'API permissions retourne un objet avec des permissions groupées par module
      // On doit chercher dans tous les modules
      let calendarPermission = null
      if (permissionsResponse?.permissions) {
        // Parcourir tous les modules pour trouver calendar.export
        for (const modulePermissions of Object.values(permissionsResponse.permissions)) {
          if (Array.isArray(modulePermissions)) {
            const found = modulePermissions.find((p: any) => p.nom === 'calendar.export')
            if (found) {
              calendarPermission = found
              break
            }
          }
        }
      }
      if (calendarPermission) {
        setPermissions([{
          id: calendarPermission.id,
          nom: calendarPermission.nom,
          description: calendarPermission.description,
          enabled: rolePermissionsData?.hasPermission || false
        }])
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Calendar className="h-5 w-5 mr-2" />
          Calendriers ICS
        </CardTitle>
        <CardDescription>
          Permettre aux chauffeurs d'exporter leur planning vers leurs applications calendrier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Sécurité :</strong> Chaque chauffeur reçoit un lien unique sécurisé. 
            Les liens ne contiennent que les courses qui lui sont assignées. 
            Vous pouvez gérer l'accès individuel dans l'onglet "Effectifs".
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Export calendrier ICS</Label>
            <p className="text-sm text-muted-foreground">
              Activer l'export des plannings pour les chauffeurs
            </p>
          </div>
          <Switch 
            checked={permissions[0]?.enabled || false}
            disabled={updating}
            onCheckedChange={async (enabled) => {
              setUpdating(true)
              
              // Mise à jour optimiste
              setPermissions(prev => prev.map(p => 
                p.nom === 'calendar.export' ? { ...p, enabled } : p
              ))
              
              try {
                const response = await fetch('/api/permissions/toggle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    permission: 'calendar.export',
                    role: 'Chauffeur',
                    enabled
                  })
                })
                
                if (response.ok) {
                  await fetchData()
                } else {
                  // Rollback
                  setPermissions(prev => prev.map(p => 
                    p.nom === 'calendar.export' ? { ...p, enabled: !enabled } : p
                  ))
                  throw new Error('Erreur lors de la mise à jour')
                }
              } catch (error) {
                console.error('Erreur:', error)
                alert('Erreur lors de la mise à jour de la permission')
                await fetchData()
              } finally {
                setUpdating(false)
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}