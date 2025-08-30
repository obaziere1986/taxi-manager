# Debug Auth Production - Session du 30/08/2025

## Problème identifié
- ✅ Connexion avec mauvais mdp → erreur affichée (OK)
- ❌ Connexion avec bon mdp → reste sur page login avec champs remplis
- ✅ Connexion fonctionne parfaitement en local
- ❌ Problème uniquement en production

## Hypothèses
Le cookie `auth-token` n'est pas correctement défini ou lu en production :
- Configuration `secure/sameSite` inadéquate
- Problème de domaine/path
- Middleware qui ne voit pas le cookie
- Timing entre définition cookie et redirection

## Modifications apportées pour debug

### 1. Page Login (`src/app/login/page.tsx`)
```diff
- router.push('/')
- router.refresh()
+ alert('✅ Connexion réussie, redirection...')
+ window.location.href = '/'
```
**Raison :** Forcer reload complet + feedback visuel

### 2. API Login (`src/app/api/simple-login/route.ts`)
```diff
+ const cookieOptions = {
+   httpOnly: true,
+   secure: process.env.NODE_ENV === 'production',
+   sameSite: 'lax' as const,
+   maxAge: 86400, // 24h
+   path: '/'
+ }
+ 
+ console.log('🍪 Configuration cookie:', {
+   env: process.env.NODE_ENV,
+   secure: cookieOptions.secure,
+   sameSite: cookieOptions.sameSite,
+   path: cookieOptions.path,
+   userEmail: user.email
+ })
+ 
+ console.log('🚀 LOGIN RÉUSSI - Cookie défini pour:', user.email)
```
**Raison :** Logs détaillés config cookie + confirmation succès

### 3. Middleware (`src/middleware.ts`)
```diff
+ if (pathname === '/') {
+   console.log('🔍 MIDDLEWARE ROOT CHECK:', {
+     pathname,
+     hasAuthToken: !!authToken,
+     cookies: request.cookies.getAll().map(c => c.name),
+     url: request.url
+   })
+ }
```
**Raison :** Vérifier si middleware reçoit le cookie

## Tests à effectuer
1. Connexion prod avec `pm2 logs taxi-manager -f` ouvert
2. Utiliser identifiants : `jean.dujardin@taxicompany.fr / password123`
3. Observer :
   - Alert dans navigateur
   - Logs côté serveur (API + middleware)
   - Comportement redirection

## Nettoyage prévu après debug
- [ ] Supprimer tous les `console.log` ajoutés
- [ ] Remplacer `alert()` par comportement normal
- [ ] Garder `window.location.href` si ça résout le problème
- [ ] Supprimer ce fichier DEBUG-AUTH.md

## Environnement
- **Prod :** Hostinger VPS (srv760049.hstgr.cloud)
- **PM2 :** taxi-manager process
- **Commit debug :** 34dd38c

## Prochaines étapes
1. Tester connexion prod
2. Analyser logs
3. Identifier cause exacte
4. Fix définitif
5. Nettoyage code