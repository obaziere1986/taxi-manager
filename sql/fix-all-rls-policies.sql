-- =================================================
-- CORRECTION RLS POUR TOUTES LES TABLES
-- Remplace les politiques restrictives par des politiques permissives
-- =================================================

-- 1. TABLE CLIENTS - Permettre toutes les opérations
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

CREATE POLICY "clients_all_access" ON public.clients FOR ALL USING (true);

-- 2. TABLE VEHICULES - Permettre toutes les opérations
DROP POLICY IF EXISTS "vehicules_select_policy" ON public.vehicules;
DROP POLICY IF EXISTS "vehicules_insert_policy" ON public.vehicules;
DROP POLICY IF EXISTS "vehicules_update_policy" ON public.vehicules;
DROP POLICY IF EXISTS "vehicules_delete_policy" ON public.vehicules;

CREATE POLICY "vehicules_all_access" ON public.vehicules FOR ALL USING (true);

-- 3. TABLE COURSES - Permettre toutes les opérations
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;

CREATE POLICY "courses_all_access" ON public.courses FOR ALL USING (true);

-- 4. TABLE VEHICULE_ASSIGNATIONS - Permettre toutes les opérations
DROP POLICY IF EXISTS "vehicule_assignations_select_policy" ON public.vehicule_assignations;
DROP POLICY IF EXISTS "vehicule_assignations_insert_policy" ON public.vehicule_assignations;
DROP POLICY IF EXISTS "vehicule_assignations_update_policy" ON public.vehicule_assignations;
DROP POLICY IF EXISTS "vehicule_assignations_delete_policy" ON public.vehicule_assignations;

CREATE POLICY "vehicule_assignations_all_access" ON public.vehicule_assignations FOR ALL USING (true);

-- 5. TABLE PERMISSIONS - Permettre toutes les opérations
DROP POLICY IF EXISTS "permissions_select_policy" ON public.permissions;
DROP POLICY IF EXISTS "permissions_insert_policy" ON public.permissions;
DROP POLICY IF EXISTS "permissions_update_policy" ON public.permissions;
DROP POLICY IF EXISTS "permissions_delete_policy" ON public.permissions;

CREATE POLICY "permissions_all_access" ON public.permissions FOR ALL USING (true);

-- 6. TABLE ROLE_PERMISSIONS - Permettre toutes les opérations
DROP POLICY IF EXISTS "role_permissions_select_policy" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_insert_policy" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_update_policy" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_delete_policy" ON public.role_permissions;

CREATE POLICY "role_permissions_all_access" ON public.role_permissions FOR ALL USING (true);

-- 7. TABLE COMPANY_SETTINGS - Permettre toutes les opérations
DROP POLICY IF EXISTS "company_settings_select_policy" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_insert_policy" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_update_policy" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_delete_policy" ON public.company_settings;

CREATE POLICY "company_settings_all_access" ON public.company_settings FOR ALL USING (true);

-- 8. TABLE AVIS_CLIENTS - Permettre toutes les opérations
DROP POLICY IF EXISTS "avis_clients_select_policy" ON public.avis_clients;
DROP POLICY IF EXISTS "avis_clients_insert_policy" ON public.avis_clients;
DROP POLICY IF EXISTS "avis_clients_update_policy" ON public.avis_clients;
DROP POLICY IF EXISTS "avis_clients_delete_policy" ON public.avis_clients;

CREATE POLICY "avis_clients_all_access" ON public.avis_clients FOR ALL USING (true);

-- 9. TABLE PARAMETRES - Permettre toutes les opérations
DROP POLICY IF EXISTS "parametres_select_policy" ON public.parametres;
DROP POLICY IF EXISTS "parametres_insert_policy" ON public.parametres;
DROP POLICY IF EXISTS "parametres_update_policy" ON public.parametres;
DROP POLICY IF EXISTS "parametres_delete_policy" ON public.parametres;

CREATE POLICY "parametres_all_access" ON public.parametres FOR ALL USING (true);

-- 10. Vérification finale
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

SELECT 'RLS All Tables Fixed! 🔓' as status;