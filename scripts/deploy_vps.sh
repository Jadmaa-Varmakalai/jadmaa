#!/bin/bash
set -e
echo "1. Unpacking release to /var/www/jadmaa/frontend..."
tar -xzf /tmp/dist.tar.gz -C /var/www/jadmaa/frontend/
chown -R www-data:www-data /var/www/jadmaa/frontend
chmod -R 755 /var/www/jadmaa/frontend

echo "2. Updating backend dist/server.cjs..."
cp /var/www/jadmaa/frontend/server.cjs /opt/jadmaa/backend/dist/server.cjs
cp /var/www/jadmaa/frontend/server.cjs.map /opt/jadmaa/backend/dist/server.cjs.map 2>/dev/null || true

echo "3. Updating database setting home.hero.cta2..."
cd /opt/jadmaa/backend
NODE_PATH=/opt/jadmaa/backend/node_modules node -r dotenv/config -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.systemSetting.updateMany({
  where: { key: 'home.hero.cta2' },
  data: { value: 'Book Demo' }
}).then(r => console.log('Successfully updated DB home.hero.cta2:', r)).catch(console.error).finally(() => prisma.\$disconnect());
" dotenv_config_path=/etc/jadmaa/backend.env

echo "4. Reloading PM2 jadmaa-backend..."
pm2 reload /opt/jadmaa/ecosystem.config.cjs

echo "5. Testing & reloading Nginx..."
nginx -t
systemctl reload nginx

echo "6. Cleaning up /tmp..."
rm -f /tmp/dist.tar.gz /tmp/deploy_vps.sh

echo "SUCCESS: Deployment completed!"
