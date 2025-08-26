-- =================================================
-- ACTIVATION RLS COMPLÈTE - TOUTES LES TABLES
-- Système de gestion taxi avec sécurité par rôles
-- À exécuter dans l'éditeur SQL de Supabase
-- =================================================

-- 1. VERIFICATION DES TABLES EXISTANTES
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Activé'
        ELSE '❌ RLS Désactivé' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =================================================
-- 2. ACTIVATION RLS SUR TOUTES LES TABLES
-- =================================================

-- Tables principales
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicule_assignations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avis_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;

-- Tables NextAuth (ignorées car n'existent pas dans cette base)
-- ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- =================================================
-- 3. SUPPRESSION DES ANCIENNES POLITIQUES
-- =================================================

-- Users
DROP POLICY IF EXISTS "users_policy" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- Clients
DROP POLICY IF EXISTS "clients_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

-- Véhicules
DROP POLICY IF EXISTS "vehicules_policy" ON public.vehicules;
DROP POLICY IF EXISTS "vehicules_select_policy" ON public.vehicules;
DROP POLICY IF EXISTS "vehicules_update_policy" ON public.vehicules;
DROP POLICY IF EXISTS "vehicules_insert_policy" ON public.vehicules;
DROP POLICY IF EXISTS "vehicules_delete_policy" ON public.vehicules;

-- Courses
DROP POLICY IF EXISTS "courses_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;

-- Assignations véhicules
DROP POLICY IF EXISTS "vehicule_assignations_policy" ON public.vehicule_assignations;
DROP POLICY IF EXISTS "vehicule_assignations_select_policy" ON public.vehicule_assignations;
DROP POLICY IF EXISTS "vehicule_assignations_update_policy" ON public.vehicule_assignations;
DROP POLICY IF EXISTS "vehicule_assignations_insert_policy" ON public.vehicule_assignations;
DROP POLICY IF EXISTS "vehicule_assignations_delete_policy" ON public.vehicule_assignations;

-- Permissions
DROP POLICY IF EXISTS "permissions_policy" ON public.permissions;
DROP POLICY IF EXISTS "permissions_select_policy" ON public.permissions;
DROP POLICY IF EXISTS "permissions_insert_policy" ON public.permissions;
DROP POLICY IF EXISTS "permissions_update_policy" ON public.permissions;
DROP POLICY IF EXISTS "permissions_delete_policy" ON public.permissions;
DROP POLICY IF EXISTS "role_permissions_policy" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_select_policy" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_insert_policy" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_update_policy" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_delete_policy" ON public.role_permissions;

-- Company Settings
DROP POLICY IF EXISTS "company_settings_policy" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_select_policy" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_update_policy" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_insert_policy" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_delete_policy" ON public.company_settings;

-- Avis Clients
DROP POLICY IF EXISTS "avis_clients_policy" ON public.avis_clients;
DROP POLICY IF EXISTS "avis_clients_select_policy" ON public.avis_clients;
DROP POLICY IF EXISTS "avis_clients_update_policy" ON public.avis_clients;
DROP POLICY IF EXISTS "avis_clients_insert_policy" ON public.avis_clients;
DROP POLICY IF EXISTS "avis_clients_delete_policy" ON public.avis_clients;

-- Parametres
DROP POLICY IF EXISTS "parametres_policy" ON public.parametres;
DROP POLICY IF EXISTS "parametres_select_policy" ON public.parametres;
DROP POLICY IF EXISTS "parametres_update_policy" ON public.parametres;
DROP POLICY IF EXISTS "parametres_insert_policy" ON public.parametres;
DROP POLICY IF EXISTS "parametres_delete_policy" ON public.parametres;

-- =================================================
-- 4. CRÉATION DES POLITIQUES RLS PAR TABLE
-- =================================================

-- ========== USERS (Utilisateurs) ==========
-- Lecture : Tous les users authentifiés peuvent voir tous les users
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Mise à jour : Seuls Admin peuvent modifier, ou user peut modifier son propre profil
CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Admin peut tout modifier
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            -- User peut modifier son propre profil
            (auth.uid()::text = id::text)
        )
    );

-- Insertion : Seuls les Admin peuvent créer des users
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

-- ========== CLIENTS ==========
-- Tous les users authentifiés peuvent gérer les clients
CREATE POLICY "clients_select_policy" ON public.clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "clients_insert_policy" ON public.clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "clients_update_policy" ON public.clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "clients_delete_policy" ON public.clients
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

-- ========== VEHICULES ==========
-- Lecture : Tous peuvent voir
CREATE POLICY "vehicules_select_policy" ON public.vehicules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Modification : Admin et Planner seulement
CREATE POLICY "vehicules_insert_policy" ON public.vehicules
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

CREATE POLICY "vehicules_update_policy" ON public.vehicules
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

CREATE POLICY "vehicules_delete_policy" ON public.vehicules
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

-- ========== COURSES ==========
-- Lecture : Tous peuvent voir toutes les courses
CREATE POLICY "courses_select_policy" ON public.courses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Création : Tous peuvent créer des courses
CREATE POLICY "courses_insert_policy" ON public.courses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Modification : Tous peuvent modifier
CREATE POLICY "courses_update_policy" ON public.courses
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Suppression : Admin et Planner seulement
CREATE POLICY "courses_delete_policy" ON public.courses
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

-- ========== VEHICULE_ASSIGNATIONS ==========
-- Lecture : Tous peuvent voir
CREATE POLICY "vehicule_assignations_select_policy" ON public.vehicule_assignations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Modification : Admin et Planner seulement
CREATE POLICY "vehicule_assignations_insert_policy" ON public.vehicule_assignations
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

CREATE POLICY "vehicule_assignations_update_policy" ON public.vehicule_assignations
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

CREATE POLICY "vehicule_assignations_delete_policy" ON public.vehicule_assignations
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

-- ========== PERMISSIONS & ROLE_PERMISSIONS ==========
-- Lecture : Tous peuvent voir les permissions (pour vérification)
CREATE POLICY "permissions_select_policy" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Modification : Seuls les Admin
CREATE POLICY "permissions_insert_policy" ON public.permissions
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

CREATE POLICY "permissions_update_policy" ON public.permissions
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

-- Role Permissions
CREATE POLICY "role_permissions_select_policy" ON public.role_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions_insert_policy" ON public.role_permissions
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

CREATE POLICY "role_permissions_update_policy" ON public.role_permissions
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

-- ========== COMPANY_SETTINGS ==========
-- Lecture : Tous les users authentifiés
CREATE POLICY "company_settings_select_policy" ON public.company_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Modification : Seuls les Admin
CREATE POLICY "company_settings_insert_policy" ON public.company_settings
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

CREATE POLICY "company_settings_update_policy" ON public.company_settings
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

-- ========== AVIS_CLIENTS ==========
-- Lecture : Tous peuvent voir les avis
CREATE POLICY "avis_clients_select_policy" ON public.avis_clients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Création : Tous peuvent créer des avis
CREATE POLICY "avis_clients_insert_policy" ON public.avis_clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Modification : Seuls Admin et Planner
CREATE POLICY "avis_clients_update_policy" ON public.avis_clients
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

-- Suppression : Seuls Admin et Planner
CREATE POLICY "avis_clients_delete_policy" ON public.avis_clients
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin') OR
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Planner')
        )
    );

-- ========== PARAMETRES ==========
-- Lecture : Tous peuvent voir les paramètres
CREATE POLICY "parametres_select_policy" ON public.parametres
    FOR SELECT USING (auth.role() = 'authenticated');

-- Modification : Seuls les Admin peuvent modifier les paramètres
CREATE POLICY "parametres_insert_policy" ON public.parametres
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

CREATE POLICY "parametres_update_policy" ON public.parametres
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

CREATE POLICY "parametres_delete_policy" ON public.parametres
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin')
    );

-- ========== TABLES NEXTAUTH ==========
-- Ces tables n'existent pas dans cette base de données
-- L'authentification semble être gérée autrement
-- (Pas de politiques nécessaires)

-- =================================================
-- 5. VÉRIFICATION FINALE
-- =================================================

-- Vérifier l'activation de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Activé'
        ELSE '❌ RLS Désactivé' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Compter les politiques par table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policies_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Afficher un résumé des politiques
SELECT 
    tablename,
    cmd as operation,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

SELECT 'RLS Configuration Complete! 🔒' as status;