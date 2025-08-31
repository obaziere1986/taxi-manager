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
      PORT: 3000
    }
  }]
};