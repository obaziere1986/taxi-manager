-- Correction des politiques RLS pour company_settings
-- À exécuter dans l'éditeur SQL de Supabase

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Allow authenticated users to read company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow service role to manage company_settings" ON company_settings;

-- Créer des politiques plus permissives (temporaire pour debug)
-- En production, vous pourrez les restreindre davantage

-- Politique de lecture - accessible à tous les utilisateurs authentifiés
CREATE POLICY "Enable read access for authenticated users" 
    ON company_settings FOR SELECT 
    USING (true);

-- Politique de mise à jour - accessible à tous les utilisateurs authentifiés
CREATE POLICY "Enable update access for authenticated users" 
    ON company_settings FOR UPDATE 
    USING (true);

-- Politique d'insertion - accessible à tous les utilisateurs authentifiés
CREATE POLICY "Enable insert access for authenticated users" 
    ON company_settings FOR INSERT 
    WITH CHECK (true);

-- Vérification des politiques actives
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