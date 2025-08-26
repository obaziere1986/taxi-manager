-- =================================================
-- CORRECTION RLS POUR AUTHENTIFICATION
-- Permet l'accès à la table users pour NextAuth
-- =================================================

-- 1. Supprimer les politiques users actuelles
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- 2. Créer des politiques plus permissives pour l'authentification

-- Lecture : Permettre la lecture pour l'authentification (sans restriction auth)
CREATE POLICY "users_auth_select_policy" ON public.users
    FOR SELECT USING (true);

-- Mise à jour : Permettre les mises à jour pour les compteurs de login
CREATE POLICY "users_auth_update_policy" ON public.users
    FOR UPDATE USING (true);

-- Insertion : Seuls les Admin peuvent créer des users (reste restrictif)
CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

-- Suppression : Seuls les Admin peuvent supprimer
CREATE POLICY "users_delete_policy" ON public.users
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

-- 3. Vérification
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

SELECT 'RLS Auth Fix Complete! 🔓' as status;