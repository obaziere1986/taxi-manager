"use client"

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/utils'

interface PlateInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  required?: boolean
  label?: string
  className?: string
}

export function PlateInput({ 
  value = '', 
  onChange, 
  placeholder = "AB-123-CD", 
  disabled = false,
  id,
  required = false,
  label,
  className
}: PlateInputProps) {
  const [inputValue, setInputValue] = useState('')

  // Parse la valeur existante au chargement
  useEffect(() => {
    if (value) {
      setInputValue(value.toUpperCase())
    }
  }, [value])

  // Formate automatiquement en XX-YYY-XX
  const formatPlate = (input: string): string => {
    // Nettoyer : garder seulement lettres et chiffres, convertir en majuscules
    const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    // Appliquer le format français : XX-YYY-XX
    let formatted = ''
    
    for (let i = 0; i < cleaned.length && formatted.length < 10; i++) { // 10 = longueur max avec tirets
      const char = cleaned[i]
      const pos = formatted.replace(/-/g, '').length // Position sans les tirets
      
      // Ajouter les tirets aux bonnes positions
      if (pos === 2 || pos === 5) {
        formatted += '-'
      }
      
      // Validation des caractères selon la position
      if (pos < 2 || pos >= 5) {
        // Positions 0,1,5,6 : doivent être des lettres
        if (/[A-Z]/.test(char)) {
          formatted += char
        }
      } else if (pos >= 2 && pos < 5) {
        // Positions 2,3,4 : doivent être des chiffres
        if (/[0-9]/.test(char)) {
          formatted += char
        }
      }
    }
    
    return formatted
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const formatted = formatPlate(input)
    
    setInputValue(formatted)
    onChange(formatted)
  }

  // Validation de la plaque complète
  const isValidPlate = (plate: string): boolean => {
    return /^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/.test(plate)
  }

  const isValid = !inputValue || isValidPlate(inputValue)
  const isComplete = inputValue.length === 9 && isValidPlate(inputValue)

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "flex-1 font-mono tracking-wider",
            !isValid && inputValue && "border-red-500 focus:border-red-500",
            isComplete && "border-green-500 focus:border-green-500"
          )}
          maxLength={9} // XX-YYY-XX = 9 caractères
        />
        
        {/* Indicateur visuel */}
        {inputValue && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isComplete ? (
              <span className="text-green-500 text-sm">✓</span>
            ) : !isValid ? (
              <span className="text-red-500 text-sm">✗</span>
            ) : (
              <span className="text-muted-foreground text-sm">
                {inputValue.replace(/-/g, '').length}/7
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Messages d'aide */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Format : XX-YYY-XX (lettres-chiffres-lettres)</p>
        {inputValue && !isValid && (
          <p className="text-red-500">
            Format invalide. Utilisez le format français : AB-123-CD
          </p>
        )}
        {isComplete && (
          <p className="text-green-600">
            Plaque d'immatriculation valide ✓
          </p>
        )}
      </div>
    </div>
  )
}