#!/bin/bash
set -e

echo "=== Step 1: Update system ==="
apt update && apt upgrade -y

echo "=== Step 2: Install Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== Step 3: Install PM2 ==="
npm install -g pm2

echo "=== Step 4: Install Certbot for SSL ==="
apt install -y certbot python3-certbot-nginx nginx

echo "=== Step 5: Clone repo ==="
cd /var/www
git clone https://github.com/BalajiMAnandhababu/personal_dashboard.git
cd personal_dashboard/Projects/To-Do

echo "=== Step 6: Install server dependencies ==="
cd server
npm install --production
cd ..

echo "=== Step 7: Build frontend ==="
cd client
npm install
npm run build
cd ..

echo "=== Step 8: Configure Nginx ==="
cat > /etc/nginx/sites-available/pdb.infinexcorp.io << 'EOF'
server {
    listen 80;
    server_name pdb.infinexcorp.io;

    # Frontend — serve React build
    location / {
        root /var/www/personal_dashboard/Projects/To-Do/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API — proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/pdb.infinexcorp.io /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== Step 9: SSL Certificate ==="
certbot --nginx -d pdb.infinexcorp.io --non-interactive --agree-tos -m balaji.anandhababu@gmail.com

echo "=== Step 10: Create env file ==="
cat > /var/www/personal_dashboard/Projects/To-Do/server/.env << 'ENVEOF'
SUPABASE_URL=REPLACE_ME
SUPABASE_ANON_KEY=REPLACE_ME
SUPABASE_SERVICE_KEY=REPLACE_ME
GROQ_API_KEY=REPLACE_ME
WHAPI_TOKEN=REPLACE_ME
WHAPI_API_URL=https://gate.whapi.cloud
BABAJI_WHATSAPP_NUMBER=919884719390
CLIENT_URL=https://pdb.infinexcorp.io
PORT=3001
ENVEOF

echo "=== Step 11: Start server with PM2 ==="
cd /var/www/personal_dashboard/Projects/To-Do/server
pm2 start index.js --name command-dashboard --node-args="--env-file=/var/www/personal_dashboard/Projects/To-Do/server/.env"
pm2 save
pm2 startup

echo "=== DONE ==="
echo ""
echo "Next steps:"
echo "  1. Edit /var/www/personal_dashboard/Projects/To-Do/server/.env and fill in REPLACE_ME values"
echo "  2. Run: pm2 restart command-dashboard"
echo "  3. Update Whapi webhook URL to: https://pdb.infinexcorp.io/api/whatsapp/incoming"
echo "  4. Visit: https://pdb.infinexcorp.io"
