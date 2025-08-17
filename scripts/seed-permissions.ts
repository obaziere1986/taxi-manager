import { PrismaClient, RoleUtilisateur } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPermissions() {
  console.log('🔑 Initialisation des permissions...')

  // Définir toutes les permissions disponibles
  const permissions = [
    // Gestion des utilisateurs
    { nom: 'users.create', description: 'Créer des utilisateurs', module: 'users', action: 'create' },
    { nom: 'users.read', description: 'Voir les utilisateurs', module: 'users', action: 'read' },
    { nom: 'users.update', description: 'Modifier les utilisateurs', module: 'users', action: 'update' },
    { nom: 'users.delete', description: 'Supprimer des utilisateurs', module: 'users', action: 'delete' },
    
    // Gestion des véhicules
    { nom: 'vehicles.create', description: 'Créer des véhicules', module: 'vehicles', action: 'create' },
    { nom: 'vehicles.read', description: 'Voir les véhicules', module: 'vehicles', action: 'read' },
    { nom: 'vehicles.update', description: 'Modifier les véhicules', module: 'vehicles', action: 'update' },
    { nom: 'vehicles.delete', description: 'Supprimer des véhicules', module: 'vehicles', action: 'delete' },
    { nom: 'vehicles.assign', description: 'Assigner des véhicules', module: 'vehicles', action: 'assign' },
    
    // Gestion des courses
    { nom: 'courses.create', description: 'Créer des courses', module: 'courses', action: 'create' },
    { nom: 'courses.read', description: 'Voir les courses', module: 'courses', action: 'read' },
    { nom: 'courses.update', description: 'Modifier les courses', module: 'courses', action: 'update' },
    { nom: 'courses.delete', description: 'Supprimer des courses', module: 'courses', action: 'delete' },
    { nom: 'courses.assign', description: 'Assigner des courses', module: 'courses', action: 'assign' },
    
    // Gestion des clients
    { nom: 'clients.create', description: 'Créer des clients', module: 'clients', action: 'create' },
    { nom: 'clients.read', description: 'Voir les clients', module: 'clients', action: 'read' },
    { nom: 'clients.update', description: 'Modifier les clients', module: 'clients', action: 'update' },
    { nom: 'clients.delete', description: 'Supprimer des clients', module: 'clients', action: 'delete' },
    
    // Analytics et dashboard
    { nom: 'analytics.read', description: 'Voir les analytics', module: 'analytics', action: 'read' },
    
    // Paramètres et administration
    { nom: 'settings.read', description: 'Voir les paramètres', module: 'settings', action: 'read' },
    { nom: 'settings.update', description: 'Modifier les paramètres', module: 'settings', action: 'update' },
    { nom: 'permissions.manage', description: 'Gérer les permissions', module: 'permissions', action: 'manage' },
  ]

  // Créer toutes les permissions
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { nom: permission.nom },
      update: permission,
      create: permission,
    })
  }

  console.log(`✅ ${permissions.length} permissions créées`)

  // Définir les permissions par défaut pour chaque rôle
  const defaultRolePermissions = {
    [RoleUtilisateur.Admin]: [
      // Admin a accès à tout
      ...permissions.map(p => p.nom)
    ],
    [RoleUtilisateur.Planner]: [
      // Planner: accès complet sauf création/suppression d'users et gestion des permissions
      'users.read', 'users.update', // Peut voir et modifier les users mais pas en créer/supprimer
      'vehicles.create', 'vehicles.read', 'vehicles.update', 'vehicles.delete', 'vehicles.assign',
      'courses.create', 'courses.read', 'courses.update', 'courses.delete', 'courses.assign',
      'clients.create', 'clients.read', 'clients.update', 'clients.delete',
      'analytics.read',
      'settings.read', // Peut voir les paramètres mais pas les modifier
    ],
    [RoleUtilisateur.Chauffeur]: [
      // Chauffeur: accès limité
      'courses.read', 'courses.update', // Peut voir et mettre à jour ses courses
      'clients.read', // Peut voir les clients
      'analytics.read', // Peut voir certaines analytics
    ]
  }

  // Appliquer les permissions par défaut
  for (const [role, permissionNames] of Object.entries(defaultRolePermissions)) {
    console.log(`🎭 Configuration des permissions pour ${role}...`)
    
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { nom: permissionName }
      })
      
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role as RoleUtilisateur,
              permissionId: permission.id
            }
          },
          update: { active: true },
          create: {
            role: role as RoleUtilisateur,
            permissionId: permission.id,
            active: true
          }
        })
      }
    }
    
    console.log(`✅ ${permissionNames.length} permissions configurées pour ${role}`)
  }

  console.log('🎉 Initialisation des permissions terminée !')
}

seedPermissions()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'initialisation des permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })