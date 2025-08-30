module.exports = {
  apps: [{
    name: 'taxi-manager',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/app.flowcab.fr',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXTAUTH_URL: 'https://app.flowcab.fr',
      NEXTAUTH_SECRET: 'your-nextauth-secret-here',
      NEXT_PUBLIC_SUPABASE_URL: 'https://pligynlgfmnequzijtqk.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-supabase-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'your-supabase-service-key'
    }
  }]
};