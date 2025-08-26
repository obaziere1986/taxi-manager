-- =================================================
-- DIAGNOSTIC DES COURSES - VÉRIFICATION RLS
-- =================================================

-- 1. Vérifier l'état de RLS sur la table courses
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'courses';

-- 2. Lister toutes les politiques sur la table courses
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'courses';

-- 3. Compter les courses en base
SELECT COUNT(*) as total_courses FROM public.courses;

-- 4. Compter par statut
SELECT 
    statut,
    COUNT(*) as count
FROM public.courses 
GROUP BY statut 
ORDER BY count DESC;

-- 5. Vérifier les courses récentes
SELECT 
    id,
    origine,
    destination,
    date_heure,
    statut,
    created_at
FROM public.courses 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Test d'accès avec différentes politiques
-- Essayer une requête simple
SELECT 'Test accès simple' as test, COUNT(*) as count FROM public.courses;

SELECT 'Diagnostic terminé ✅' as status;