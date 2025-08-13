"use client"

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
}

const countries: Country[] = [
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
]

interface PhoneInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  required?: boolean
  label?: string
}

export function PhoneInput({ 
  value = '', 
  onChange, 
  placeholder = "12 34 56 78 90", 
  disabled = false,
  id,
  required = false,
  label
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('FR')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Parse le numéro existant au chargement
  useEffect(() => {
    if (value) {
      // Essaie de parser le format +XX XX XX XX XX
      const match = value.match(/^(\+\d{1,4})\s*(.*)$/)
      if (match) {
        const dialCode = match[1]
        const number = match[2].replace(/\s/g, '')
        const country = countries.find(c => c.dialCode === dialCode)
        if (country) {
          setCountryCode(country.code)
          setPhoneNumber(number)
          return
        }
      }
      // Si pas de format international, considère comme français
      setCountryCode('FR')
      setPhoneNumber(value.replace(/[^\d]/g, ''))
    }
  }, [value])

  // Formate le numéro selon le pays
  const formatPhoneNumber = (number: string, countryCode: string) => {
    const cleaned = number.replace(/[^\d]/g, '')
    
    if (countryCode === 'FR') {
      // Format français: XX XX XX XX XX
      return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
    } else {
      // Format international standard: XX XX XX XX XX
      return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
    }
  }

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode)
    updateValue(phoneNumber, newCountryCode)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^\d]/g, '') // Garde seulement les chiffres
    
    // Limite selon le pays (FR: 10 chiffres, autres: 15 max)
    const maxLength = countryCode === 'FR' ? 10 : 15
    const limited = input.slice(0, maxLength)
    
    setPhoneNumber(limited)
    updateValue(limited, countryCode)
  }

  const updateValue = (number: string, country: string) => {
    const selectedCountry = countries.find(c => c.code === country)
    if (!selectedCountry) return

    if (!number) {
      onChange('')
      return
    }

    const formattedNumber = formatPhoneNumber(number, country)
    const fullNumber = `${selectedCountry.dialCode} ${formattedNumber}`
    onChange(fullNumber)
  }

  const getPlaceholderForCountry = (countryCode: string) => {
    switch (countryCode) {
      case 'FR': return '12 34 56 78 90'
      case 'BE': return '12 34 56 78'
      case 'CH': return '12 345 67 89'
      case 'CA':
      case 'US': return '123 456 7890'
      case 'GB': return '1234 567890'
      default: return '12 34 56 78 90'
    }
  }

  const selectedCountry = countries.find(c => c.code === countryCode)

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              {selectedCountry && (
                <div className="flex items-center gap-2">
                  <span>{selectedCountry.flag}</span>
                  <span className="text-sm">{selectedCountry.dialCode}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.dialCode}</span>
                  <span className="text-sm text-muted-foreground">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          id={id}
          type="tel"
          value={formatPhoneNumber(phoneNumber, countryCode)}
          onChange={handlePhoneChange}
          placeholder={getPlaceholderForCountry(countryCode)}
          disabled={disabled}
          required={required}
          className="flex-1"
        />
      </div>
      
      {value && (
        <p className="text-sm text-muted-foreground">
          Format final : {value}
        </p>
      )}
    </div>
  )
}