"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  searchTerms?: string[] // Termes de recherche additionnels
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.searchTerms?.join(' ') || ''}`}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Composant spécialisé pour les clients
interface ClientComboboxProps {
  clients: Array<{ id: string; nom: string; prenom: string; telephone?: string }>
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ClientCombobox({
  clients,
  value,
  onValueChange,
  placeholder = "Sélectionner un client...",
  className,
  disabled = false,
}: ClientComboboxProps) {
  const options: ComboboxOption[] = clients
    .sort((a, b) => a.nom.localeCompare(b.nom))
    .map((client) => ({
      value: client.id,
      label: `${client.nom.toUpperCase()} ${client.prenom}${client.telephone ? ` - ${client.telephone}` : ''}`,
      searchTerms: [
        client.nom.toLowerCase(),
        client.prenom.toLowerCase(),
        client.telephone || '',
        `${client.nom.toLowerCase()} ${client.prenom.toLowerCase()}`,
        `${client.prenom.toLowerCase()} ${client.nom.toLowerCase()}`
      ]
    }))

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher un client..."
      emptyMessage="Aucun client trouvé."
      className={className}
      disabled={disabled}
    />
  )
}

// Composant spécialisé pour les chauffeurs
interface ChauffeurComboboxProps {
  chauffeurs: Array<{ id: string; nom: string; prenom: string; vehicule?: string; statut?: string }>
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showVehicle?: boolean
  showStatus?: boolean
}

export function ChauffeurCombobox({
  chauffeurs,
  value,
  onValueChange,
  placeholder = "Sélectionner un chauffeur...",
  className,
  disabled = false,
  showVehicle = true,
  showStatus = false,
}: ChauffeurComboboxProps) {
  const options: ComboboxOption[] = chauffeurs
    .sort((a, b) => a.nom.localeCompare(b.nom))
    .map((chauffeur) => {
      let label = `${chauffeur.nom.toUpperCase()} ${chauffeur.prenom}`
      
      if (showVehicle && chauffeur.vehicule) {
        label += ` - ${chauffeur.vehicule}`
      }
      
      if (showStatus && chauffeur.statut) {
        const statutLabel = chauffeur.statut === 'DISPONIBLE' ? 'Disponible' :
                          chauffeur.statut === 'OCCUPE' ? 'Occupé' : 'Hors service'
        label += ` (${statutLabel})`
      }

      return {
        value: chauffeur.id,
        label,
        searchTerms: [
          chauffeur.nom.toLowerCase(),
          chauffeur.prenom.toLowerCase(),
          chauffeur.vehicule?.toLowerCase() || '',
          `${chauffeur.nom.toLowerCase()} ${chauffeur.prenom.toLowerCase()}`,
          `${chauffeur.prenom.toLowerCase()} ${chauffeur.nom.toLowerCase()}`
        ]
      }
    })

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher un chauffeur..."
      emptyMessage="Aucun chauffeur trouvé."
      className={className}
      disabled={disabled}
    />
  )
}