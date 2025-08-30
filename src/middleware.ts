import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ['/login', '/api/auth', '/api/settings/debug', '/api/debug-auth', '/api/debug-nextauth', '/api/simple-login', '/api/current-user', '/api/logout', '/api/health', '/health']

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
  
  // Permettre l'accès aux routes publiques et aux APIs d'auth
  if (publicRoutes.some(route => pathname.startsWith(route))) {
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
  
  // Vérifier l'authentification JWT pour toutes les autres routes
  const authToken = request.cookies.get('auth-token')?.value
  
  if (pathname === '/') {
    console.log('🔍 MIDDLEWARE ROOT CHECK:', {
      pathname,
      hasAuthToken: !!authToken,
      cookies: request.cookies.getAll().map(c => c.name),
      url: request.url
    })
  }
  
  if (!authToken) {
    // Rediriger vers la page de connexion si non authentifié
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Vérifier la validité du token JWT
  try {
    const { jwtVerify } = await import('jose')
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    await jwtVerify(authToken, secret)
  } catch (error) {
    // Token invalide, rediriger vers login
    console.error('Token JWT invalide:', error)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
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
