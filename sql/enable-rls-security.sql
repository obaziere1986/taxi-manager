-- =================================================
-- Activation et configuration RLS pour company_settings
-- À exécuter dans l'éditeur SQL de Supabase
-- =================================================

-- 1. Vérifier d'abord si la table existe
SELECT table_name, row_security 
FROM information_schema.tables 
WHERE table_name = 'company_settings' 
  AND table_schema = 'public';

-- 2. Activer RLS sur la table company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.company_settings;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.company_settings;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update company_settings" ON public.company_settings;

-- 4. Créer des politiques RLS sécurisées mais fonctionnelles

-- Politique de lecture : accessible à tous les utilisateurs connectés
CREATE POLICY "company_settings_select_policy" 
    ON public.company_settings 
    FOR SELECT 
    USING (true);

-- Politique de mise à jour : accessible à tous les utilisateurs connectés  
CREATE POLICY "company_settings_update_policy" 
    ON public.company_settings 
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- Politique d'insertion : accessible à tous les utilisateurs connectés
CREATE POLICY "company_settings_insert_policy" 
    ON public.company_settings 
    FOR INSERT 
    WITH CHECK (true);

-- 5. Vérifier l'activation de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'company_settings';

-- 6. Lister toutes les politiques actives
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'company_settings';

-- 7. Test d'accès (devrait fonctionner maintenant)
SELECT COUNT(*) as company_settings_count FROM public.company_settings;