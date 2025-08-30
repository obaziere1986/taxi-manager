#!/usr/bin/env node

// Script de diagnostic pour la production
console.log('🔍 Diagnostic de production...\n')

// Test 1: Vérification des variables d'environnement essentielles
console.log('1️⃣ Variables d\'environnement:')
const requiredVars = [
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL', 
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NODE_ENV'
]

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '[REDACTED]' : value}`)
  } else {
    console.log(`❌ ${varName}: NON DÉFINIE`)
  }
})

// Test 2: Test de création JWT
console.log('\n2️⃣ Test de création JWT:')
try {
  const { SignJWT } = require('jose')
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
  
  SignJWT({ test: 'value' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)
    .then(token => {
      console.log('✅ JWT créé avec succès')
      console.log(`Token longueur: ${token.length} caractères`)
    })
    .catch(error => {
      console.log('❌ Erreur création JWT:', error.message)
    })
} catch (error) {
  console.log('❌ Module jose non disponible:', error.message)
}

// Test 3: Test connexion Supabase
console.log('\n3️⃣ Test connexion Supabase:')
try {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Client Supabase créé')
    
    // Test simple de connexion
    supabase
      .from('users')
      .select('count')
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.log('❌ Erreur Supabase:', error.message)
        } else {
          console.log('✅ Connexion Supabase OK')
        }
      })
  } else {
    console.log('❌ Variables Supabase manquantes')
  }
} catch (error) {
  console.log('❌ Module Supabase non disponible:', error.message)
}

console.log('\n🔍 Diagnostic terminé')