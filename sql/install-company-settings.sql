-- =================================================
-- Installation du système de paramètres d'entreprise
-- À exécuter dans l'éditeur SQL de Supabase
-- =================================================

-- 1. Création de la table company_settings
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informations entreprise
  company_name VARCHAR(255) NOT NULL DEFAULT 'Taxi Manager',
  company_phone VARCHAR(20),
  company_email VARCHAR(255),
  company_address TEXT,
  
  -- Horaires
  opening_hours TIME DEFAULT '06:00:00',
  closing_hours TIME DEFAULT '23:00:00',
  
  -- Tarifs
  base_fare DECIMAL(10,2) DEFAULT 4.20,
  price_per_km_day DECIMAL(10,2) DEFAULT 1.15,
  price_per_km_night DECIMAL(10,2) DEFAULT 1.50,
  night_start_time TIME DEFAULT '20:00:00',
  night_end_time TIME DEFAULT '07:00:00',
  
  -- Paramètres opérationnels
  average_trip_duration INTEGER DEFAULT 45,
  max_distance_km INTEGER DEFAULT 100,
  
  -- Localisation et format
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  currency VARCHAR(3) DEFAULT 'EUR',
  language VARCHAR(5) DEFAULT 'fr-FR',
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Trigger pour updated_at sur company_settings
DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
CREATE TRIGGER update_company_settings_updated_at 
    BEFORE UPDATE ON company_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Insérer des données par défaut (un seul enregistrement)
INSERT INTO company_settings (
  company_name, 
  company_phone, 
  company_email,
  base_fare,
  price_per_km_day,
  price_per_km_night
) VALUES (
  'Taxis Excellence',
  '01 23 45 67 89',
  'contact@taxis-excellence.fr',
  4.20,
  1.15,
  1.50
) ON CONFLICT (id) DO NOTHING;

-- 5. Configuration RLS (Row Level Security)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to read company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update company_settings" ON company_settings;

-- Créer les nouvelles politiques RLS
CREATE POLICY "Allow authenticated users to read company_settings" 
    ON company_settings FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update company_settings" 
    ON company_settings FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- 6. Vérification de l'installation
SELECT 
    'company_settings table created successfully' as status,
    COUNT(*) as records_count 
FROM company_settings;