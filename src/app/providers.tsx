"use client"

// Provider simple qui ne fait que passer les enfants
// Plus besoin de NextAuth SessionProvider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}