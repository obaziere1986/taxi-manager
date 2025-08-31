module.exports = {
  apps: [{
    name: 'taxi-manager-dev',
    script: 'npm',
    args: 'run dev',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: true,
    ignore_watch: ['node_modules', '.next', '.git'],
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
};