import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null
        }

        // Rechercher l'utilisateur par login ou email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { login: credentials.login },
              { email: credentials.login }
            ],
            actif: true
          }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        // Vérifier si le compte est verrouillé
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)
        
        if (!isValidPassword) {
          // Incrémenter les échecs de connexion
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLogins: user.failedLogins + 1,
              lockedUntil: user.failedLogins >= 4 ? 
                new Date(Date.now() + 15 * 60 * 1000) : // Verrouiller 15 minutes après 5 échecs
                null
            }
          })
          return null
        }

        // Réinitialiser les échecs et mettre à jour la dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLogins: 0,
            lockedUntil: null,
            lastLoginAt: new Date()
          }
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
          statut: user.statut,
          avatarUrl: user.avatarUrl
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.statut = user.statut
        token.avatarUrl = user.avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token.sub) {
        // Récupérer les données à jour de l'utilisateur, y compris l'avatarUrl
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
            statut: true,
            avatarUrl: true
          }
        })
        
        if (user) {
          session.user.id = user.id
          session.user.name = `${user.prenom} ${user.nom}`
          session.user.email = user.email
          session.user.role = user.role
          session.user.statut = user.statut
          session.user.avatarUrl = user.avatarUrl
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
}