#!/bin/bash
set -e
# Run on VPS to pull latest code and restart
cd /var/www/personal_dashboard
git pull origin main

cd Projects/To-Do/client
npm install
npm run build

cd ../server
npm install --production
pm2 restart command-dashboard

echo "Redeployed successfully."
