import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes publiques selon l'environnement
const basePublicRoutes = ['/login', '/api/current-user', '/api/logout', '/api/health', '/health', '/avis', '/api/avis/submit']
const devOnlyRoutes = ['/api/settings/debug', '/api/debug-auth', '/api/debug-nextauth', '/api/clear-cookies', '/api/test-auth', '/api/debug-session']

const publicRoutes = process.env.NODE_ENV === 'development' 
  ? [...basePublicRoutes, ...devOnlyRoutes]
  : basePublicRoutes

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
  
  // Permettre l'accès aux routes publiques et aux APIs d'auth
  if (publicRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/auth')) {
    const response = NextResponse.next();
    
    // Headers de cache pour les API
    if (pathname.startsWith("/api/")) {
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
    }
    
    return response;
  }
  
  // Permettre l'accès aux assets statiques
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }
  
  // Vérifier l'authentification NextAuth pour toutes les autres routes
  const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                       request.cookies.get('__Secure-next-auth.session-token')?.value
  
  if (!sessionToken) {
    // Rediriger vers la page de connexion
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  const response = NextResponse.next();

  // Headers de cache pour les API
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  // Ajouter des en-têtes de sécurité
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  return response;
  } catch (error) {
    // En cas d'erreur dans le middleware, laisser passer la requête
    console.error('Erreur middleware:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
