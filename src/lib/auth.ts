import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import bcrypt from "bcryptjs"
import { getSupabaseClient } from "@/lib/supabase"

export const authOptions: NextAuthOptions = {
  // adapter: SupabaseAdapter({
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   secret: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  // }),
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

        const supabase = getSupabaseClient()

        // Rechercher l'utilisateur par login ou email
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .or(`login.eq.${credentials.login},email.eq.${credentials.login}`)
          .eq('actif', true)

        if (error || !users || users.length === 0) {
          return null
        }

        const user = users[0]

        if (!user || !user.password_hash) {
          return null
        }

        // Vérifier si le compte est verrouillé
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
          return null
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
        
        if (!isValidPassword) {
          // Incrémenter les échecs de connexion
          await supabase
            .from('users')
            .update({
              failed_logins: user.failed_logins + 1,
              locked_until: user.failed_logins >= 4 ? 
                new Date(Date.now() + 15 * 60 * 1000).toISOString() : 
                null
            })
            .eq('id', user.id)
          return null
        }

        // Réinitialiser les échecs et mettre à jour la dernière connexion
        await supabase
          .from('users')
          .update({
            failed_logins: 0,
            locked_until: null,
            last_login_at: new Date().toISOString()
          })
          .eq('id', user.id)

        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
          statut: user.statut,
          avatarUrl: user.avatar_url
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
        const supabase = getSupabaseClient()
        
        // Récupérer les données à jour de l'utilisateur
        const { data: user } = await supabase
          .from('users')
          .select('id, nom, prenom, email, role, statut, avatar_url')
          .eq('id', token.sub)
          .single()
        
        if (user) {
          session.user.id = user.id
          session.user.name = `${user.prenom} ${user.nom}`
          session.user.email = user.email
          session.user.role = user.role
          session.user.statut = user.statut
          session.user.avatarUrl = user.avatar_url
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