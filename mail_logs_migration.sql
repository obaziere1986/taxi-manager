-- Migration pour créer la table mail_logs
-- À exécuter dans l'éditeur SQL de Supabase

CREATE TABLE IF NOT EXISTS mail_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'welcome', 'course_assignment', 'course_reminder', etc.
  to_emails TEXT NOT NULL, -- emails destinataires séparés par virgules
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'sent', 'failed', 'pending'
  error_message TEXT, -- message d'erreur en cas d'échec
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255), -- ID de l'utilisateur concerné (optionnel)
  course_id UUID, -- ID de la course concernée (optionnel)
  
  -- Colonnes de métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_mail_logs_status ON mail_logs(status);
CREATE INDEX IF NOT EXISTS idx_mail_logs_type ON mail_logs(type);
CREATE INDEX IF NOT EXISTS idx_mail_logs_sent_at ON mail_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_logs_user_id ON mail_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_logs_course_id ON mail_logs(course_id);

-- RLS (Row Level Security) - Seuls les admins peuvent voir les logs
ALTER TABLE mail_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de tout voir
CREATE POLICY "Admins can view all mail logs" ON mail_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email' 
      AND users.role = 'Admin'
      AND users.actif = true
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mail_logs_updated_at 
  BEFORE UPDATE ON mail_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();