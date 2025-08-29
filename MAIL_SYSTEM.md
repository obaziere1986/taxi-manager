# 📧 Système de Mails - Taxi Manager

Documentation complète du système de notifications par email intégré avec Hostinger SMTP.

## 🚀 Fonctionnalités

### ✅ Types de mails automatiques
- **Bienvenue** : Envoyé lors de la création d'un nouvel utilisateur
- **Assignation** : Notification quand une course est assignée
- **Rappels** : 1h et 30min avant les courses
- **Confirmation** : Course terminée (à implémenter)
- **Annulation** : Course annulée (à implémenter)

### ✅ Interface d'administration
- Test de configuration SMTP
- Envoi d'emails personnalisés
- Historique des envois (à implémenter)
- Gestion des templates

## 🛠️ Configuration

### 1. Variables d'environnement (.env.local)

```env
# SMTP Hostinger
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_USER=votre-email@votredomaine.com
SMTP_PASS=votre-mot-de-passe

# Configuration mail
MAIL_FROM_NAME=Taxi Manager
MAIL_SUPPORT_EMAIL=support@votredomaine.com
```

### 2. Base de données Supabase

Exécutez le script SQL `mail_logs_migration.sql` dans l'éditeur SQL de Supabase pour créer la table des logs.

### 3. Permissions RLS

La table `mail_logs` est protégée par RLS - seuls les admins peuvent voir les logs.

## 📁 Architecture des fichiers

```
src/
├── lib/
│   ├── mailer.ts              # Configuration Nodemailer
│   ├── mail-templates.ts      # Templates HTML/Text
│   └── mail-hooks.ts          # Fonctions d'envoi
├── components/mail/
│   └── MailSettings.tsx       # Interface admin
└── app/api/mail/
    ├── send/route.ts          # API envoi
    ├── test/route.ts          # API test
    └── logs/route.ts          # API logs
```

## 🔧 Utilisation

### Envoi automatique

Les mails sont envoyés automatiquement lors de certaines actions :

```typescript
// Création utilisateur (dans /api/users/route.ts)
await sendWelcomeEmail({
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  role: user.role
});

// Assignation course (dans /api/courses/[id]/assign/route.ts)
await sendCourseAssignmentEmail(userData, courseData);
```

### Envoi manuel via API

```typescript
const response = await fetch('/api/mail/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom',
    to: 'destinataire@example.com',
    customSubject: 'Sujet personnalisé',
    customContent: 'Message personnalisé'
  })
});
```

## 🎨 Templates disponibles

### 1. Email de bienvenue
- **Type** : `welcome`
- **Variables** : user (nom, prenom, email, role)
- **Design** : Logo, informations compte, lien connexion

### 2. Notification d'assignation
- **Type** : `course_assignment`
- **Variables** : user, course (origine, destination, date, client)
- **Design** : Détails course, informations client

### 3. Rappel de course
- **Type** : `course_reminder`
- **Variables** : user, course, reminderTime
- **Design** : Alerte urgente, détails course, contact client

### 4. Course terminée
- **Type** : `course_completed`
- **Variables** : user, course
- **Design** : Confirmation succès, récapitulatif

### 5. Course annulée
- **Type** : `course_cancelled`
- **Variables** : user, course
- **Design** : Alerte annulation, nouvelle planification

## 🧪 Tests

### Test de configuration
```bash
# GET /api/mail/test
curl http://localhost:3000/api/mail/test
```

### Test d'envoi
```bash
# POST /api/mail/test
curl -X POST http://localhost:3000/api/mail/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

## 📊 Logs et monitoring

### Structure des logs (table `mail_logs`)
```sql
- id: UUID
- type: Type de mail ('welcome', 'course_assignment', etc.)
- to_emails: Destinataires (séparés par virgules)
- subject: Sujet du mail
- status: 'sent', 'failed', 'pending'
- error_message: Message d'erreur si échec
- sent_at: Timestamp d'envoi
- user_id: ID utilisateur concerné
- course_id: ID course concernée
```

### API des logs
```typescript
// Récupérer les logs
GET /api/mail/logs?limit=50&offset=0&status=sent&type=welcome

// Créer un log
POST /api/mail/logs
{
  "type": "welcome",
  "to_emails": "user@example.com",
  "subject": "Bienvenue",
  "status": "sent"
}
```

## 🔒 Sécurité

### Variables d'environnement
- Toutes les credentials SMTP sont en variables d'env
- Pas de hardcoding des mots de passe
- Séparation dev/prod

### Validation
- Validation des emails avec regex
- Sanitisation des données utilisateur
- Protection contre l'injection

### RLS Supabase
- Seuls les admins voient les logs
- Politiques RLS strictes
- Audit trail complet

## 🚀 Déploiement

### 1. Configuration Hostinger
1. Créer une adresse email dans cPanel
2. Récupérer les paramètres SMTP
3. Tester la connexion

### 2. Variables de production
```env
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_USER=contact@votredomaine.com
SMTP_PASS=mot-de-passe-production
NEXTAUTH_URL=https://votre-domaine.com
```

### 3. Migration Supabase
```sql
-- Exécuter mail_logs_migration.sql en production
-- Vérifier les politiques RLS
-- Tester les permissions admin
```

## 🔮 Améliorations futures

### Templates avancés
- [ ] Éditeur WYSIWYG pour les templates
- [ ] Variables dynamiques personnalisées
- [ ] Templates conditionnels par rôle

### Notifications avancées
- [ ] Système de queue pour gros volumes
- [ ] Retry avec backoff exponentiel
- [ ] Templates multilingues

### Analytics
- [ ] Taux d'ouverture des emails
- [ ] Statistiques d'engagement
- [ ] Dashboard de monitoring

### Intégrations
- [ ] Webhooks pour événements externes
- [ ] API REST complète
- [ ] SDK pour développeurs

## 💡 Conseils d'utilisation

### Performance
- Les emails sont envoyés de manière asynchrone
- En cas d'échec SMTP, l'action principale n'échoue pas
- Système de retry automatique

### Personnalisation
- Modifier les templates dans `mail-templates.ts`
- Ajouter vos variables personnalisées
- Adapter les styles CSS aux couleurs de votre marque

### Monitoring
- Surveiller les logs d'erreur
- Vérifier régulièrement la configuration SMTP
- Tester avant les déploiements

---

**Développé avec ❤️ pour Taxi Manager**  
*Version 1.0 - Système complet avec Hostinger SMTP*