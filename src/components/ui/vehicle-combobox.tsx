"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Car, Check, ChevronDown, User, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VehiculeWithStatus {
  id: string
  marque: string
  modele: string
  immatriculation: string
  couleur?: string
  annee?: number
  actif: boolean
  isAssigned: boolean
  assignation?: {
    id: string
    dateDebut: string
    assignedTo: string
    assignedToRole: string
  } | null
}

interface VehicleComboboxProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  required?: boolean
  label?: string
}

export function VehicleCombobox({ 
  value = '', 
  onChange, 
  placeholder = "Choisir un véhicule...", 
  disabled = false,
  id,
  required = false,
  label
}: VehicleComboboxProps) {
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<VehiculeWithStatus[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vehicules/with-assignations')
      const data = await response.json()
      setVehicles(data)
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  // Séparer les véhicules en catégories
  const availableVehicles = vehicles.filter(v => v.actif && !v.isAssigned)
  const assignedVehicles = vehicles.filter(v => v.actif && v.isAssigned)

  const selectedVehicle = vehicles.find(v => v.id === value)

  const formatVehicleName = (vehicle: VehiculeWithStatus) => {
    return `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
  }

  const handleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    
    if (vehicle?.isAssigned) {
      // Demander confirmation pour réassignation
      const confirmMessage = `Ce véhicule est actuellement assigné à ${vehicle.assignation?.assignedTo} (${vehicle.assignation?.assignedToRole}).\n\nVoulez-vous le réassigner ? Cette action désassignera automatiquement l'ancien utilisateur.`
      
      if (confirm(confirmMessage)) {
        onChange(vehicleId)
        setOpen(false)
      }
    } else {
      onChange(vehicleId)
      setOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedVehicle && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {selectedVehicle ? (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span>{formatVehicleName(selectedVehicle)}</span>
                {selectedVehicle.isAssigned && (
                  <Badge variant="secondary" className="text-xs">
                    Assigné
                  </Badge>
                )}
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un véhicule..." />
            <CommandList>
              {loading ? (
                <CommandEmpty>Chargement...</CommandEmpty>
              ) : (
                <>
                  {availableVehicles.length === 0 && assignedVehicles.length === 0 ? (
                    <CommandEmpty>Aucun véhicule trouvé.</CommandEmpty>
                  ) : (
                    <>
                      {availableVehicles.length > 0 && (
                        <CommandGroup heading={`Véhicules disponibles (${availableVehicles.length})`}>
                          {availableVehicles.map((vehicle) => (
                            <CommandItem
                              key={vehicle.id}
                              value={`${vehicle.marque} ${vehicle.modele} ${vehicle.immatriculation}`}
                              onSelect={() => handleSelect(vehicle.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-green-500" />
                                  <div>
                                    <div className="font-medium">
                                      {vehicle.marque} {vehicle.modele}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {vehicle.immatriculation}
                                      {vehicle.couleur && ` • ${vehicle.couleur}`}
                                      {vehicle.annee && ` • ${vehicle.annee}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    Disponible
                                  </Badge>
                                  <Check
                                    className={cn(
                                      "h-4 w-4",
                                      value === vehicle.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {availableVehicles.length > 0 && assignedVehicles.length > 0 && (
                        <CommandSeparator />
                      )}

                      {assignedVehicles.length > 0 && (
                        <CommandGroup heading={`Véhicules assignés (${assignedVehicles.length})`}>
                          {assignedVehicles.map((vehicle) => (
                            <CommandItem
                              key={vehicle.id}
                              value={`${vehicle.marque} ${vehicle.modele} ${vehicle.immatriculation}`}
                              onSelect={() => handleSelect(vehicle.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-orange-500" />
                                  <div>
                                    <div className="font-medium">
                                      {vehicle.marque} {vehicle.modele}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {vehicle.immatriculation}
                                      {vehicle.couleur && ` • ${vehicle.couleur}`}
                                      {vehicle.annee && ` • ${vehicle.annee}`}
                                    </div>
                                    <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                      <User className="h-3 w-3" />
                                      Assigné à {vehicle.assignation?.assignedTo} ({vehicle.assignation?.assignedToRole})
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Assigné
                                  </Badge>
                                  <Check
                                    className={cn(
                                      "h-4 w-4",
                                      value === vehicle.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {required && !value && (
        <p className="text-sm text-red-500">
          Veuillez sélectionner un véhicule
        </p>
      )}
      
      {selectedVehicle?.isAssigned && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Réassignation</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            Ce véhicule sera automatiquement désassigné de <strong>{selectedVehicle.assignation?.assignedTo}</strong> 
            {' '}({selectedVehicle.assignation?.assignedToRole}) lors de la nouvelle assignation.
          </p>
        </div>
      )}
    </div>
  )
}