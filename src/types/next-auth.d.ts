import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      statut: string
      avatarUrl?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    statut: string
    avatarUrl?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    statut: string
    avatarUrl?: string
  }
}