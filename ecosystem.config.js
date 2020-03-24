module.exports = {
  apps : [{
    name: 'seo',
    script: './bin/www',

    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
  //  args: 'one two',
    exec_mode:'cluster',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      NODE_PATH:'./src'

    },
    env_production: {
      NODE_ENV: 'production',
      NODE_PATH:'./src'
    }
  }],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};