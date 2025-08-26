-- =========================================
-- MIGRATION TAXI MANAGER VERS SUPABASE
-- =========================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. TABLE CLIENTS
-- =========================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR NOT NULL,
    prenom VARCHAR NOT NULL,
    telephone VARCHAR NOT NULL,
    email VARCHAR,
    adresses JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_clients_telephone ON clients(telephone);

-- =========================================
-- 2. ÉNUMÉRATIONS
-- =========================================
DO $$ BEGIN
    CREATE TYPE statut_course AS ENUM ('EN_ATTENTE', 'ASSIGNEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_personne AS ENUM ('DISPONIBLE', 'OCCUPE', 'HORS_SERVICE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role_utilisateur AS ENUM ('Admin', 'Planner', 'Chauffeur');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================================
-- 3. TABLE USERS (remplace Chauffeur)
-- =========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR NOT NULL,
    prenom VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    telephone VARCHAR NOT NULL,
    role role_utilisateur DEFAULT 'Chauffeur',
    statut statut_personne DEFAULT 'DISPONIBLE',
    actif BOOLEAN DEFAULT true,
    
    -- Authentification
    login VARCHAR UNIQUE,
    password_hash VARCHAR,
    
    -- Sessions
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_logins INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Préférences de notifications
    notifications_email BOOLEAN DEFAULT true,
    notifications_sms BOOLEAN DEFAULT false,
    notifications_desktop BOOLEAN DEFAULT true,
    
    -- Photo de profil
    avatar_url VARCHAR,
    
    -- Informations véhicule
    vehicule VARCHAR,
    vehicule_id UUID,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_statut ON users(statut);
CREATE INDEX IF NOT EXISTS idx_users_actif ON users(actif);

-- =========================================
-- 4. TABLE VEHICULES
-- =========================================
CREATE TABLE IF NOT EXISTS vehicules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marque VARCHAR NOT NULL,
    modele VARCHAR NOT NULL,
    immatriculation VARCHAR NOT NULL UNIQUE,
    couleur VARCHAR,
    annee INTEGER,
    actif BOOLEAN DEFAULT true,
    
    -- Informations techniques
    kilometrage INTEGER DEFAULT 0,
    carburant VARCHAR,
    
    -- Prochaines dates d'entretien
    prochaine_vidange TIMESTAMP WITH TIME ZONE,
    prochain_entretien TIMESTAMP WITH TIME ZONE,
    prochain_controle_technique TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_vehicules_immatriculation ON vehicules(immatriculation);
CREATE INDEX IF NOT EXISTS idx_vehicules_actif ON vehicules(actif);

-- =========================================
-- 5. TABLE VEHICULE_ASSIGNATIONS
-- =========================================
CREATE TABLE IF NOT EXISTS vehicule_assignations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_debut TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_fin TIMESTAMP WITH TIME ZONE,
    actif BOOLEAN DEFAULT true,
    notes TEXT,
    
    vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_vehicule_assignations_vehicule ON vehicule_assignations(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_vehicule_assignations_user ON vehicule_assignations(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicule_assignations_actif ON vehicule_assignations(actif);

-- Ajouter la contrainte de clé étrangère pour vehicule_id dans users
ALTER TABLE users ADD CONSTRAINT fk_users_vehicule 
    FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE SET NULL;

-- =========================================
-- 6. TABLE COURSES
-- =========================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origine VARCHAR NOT NULL,
    destination VARCHAR NOT NULL,
    date_heure TIMESTAMP WITH TIME ZONE NOT NULL,
    statut statut_course DEFAULT 'EN_ATTENTE',
    prix DECIMAL(10,2), -- Prix de la course
    notes TEXT,
    
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_courses_client ON courses(client_id);
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_statut ON courses(statut);
CREATE INDEX IF NOT EXISTS idx_courses_date_heure ON courses(date_heure);

-- =========================================
-- 7. TABLE AVIS_CLIENTS
-- =========================================
CREATE TABLE IF NOT EXISTS avis_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note INTEGER NOT NULL CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_avis_clients_course ON avis_clients(course_id);
CREATE INDEX IF NOT EXISTS idx_avis_clients_client ON avis_clients(client_id);

-- =========================================
-- 8. TABLE PARAMETRES
-- =========================================
CREATE TABLE IF NOT EXISTS parametres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cle VARCHAR NOT NULL UNIQUE,
    valeur TEXT NOT NULL,
    type VARCHAR DEFAULT 'string',
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_parametres_cle ON parametres(cle);

-- =========================================
-- 9. TABLE PERMISSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_permissions_nom ON permissions(nom);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- =========================================
-- 10. TABLE ROLE_PERMISSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role role_utilisateur NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role, permission_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- =========================================
-- 11. TRIGGERS POUR UPDATED_AT
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer les triggers sur toutes les tables avec updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicules_updated_at BEFORE UPDATE ON vehicules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicule_assignations_updated_at BEFORE UPDATE ON vehicule_assignations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avis_clients_updated_at BEFORE UPDATE ON avis_clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametres_updated_at BEFORE UPDATE ON parametres 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 12. ROW LEVEL SECURITY (RLS)
-- =========================================

-- Activer RLS sur toutes les tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicule_assignations ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS basiques (à adapter selon vos besoins de sécurité)
-- Pour l'instant, permettre l'accès à tous les utilisateurs authentifiés

CREATE POLICY "Allow authenticated access" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON vehicules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON vehicule_assignations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON courses
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON avis_clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON parametres
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON permissions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access" ON role_permissions
    FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- MIGRATION TERMINÉE
-- =========================================

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration Taxi Manager vers Supabase terminée avec succès !';
    RAISE NOTICE 'Tables créées: clients, users, vehicules, vehicule_assignations, courses, avis_clients, parametres, permissions, role_permissions';
    RAISE NOTICE 'Indexes et triggers configurés';
    RAISE NOTICE 'RLS activé avec politiques de base';
END $$;