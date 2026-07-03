#!/usr/bin/env bash
# One-time setup script for a fresh Google Cloud Free Tier VM
# (e2-micro, Ubuntu 22.04). Run this after SSHing into the VM:
#   bash setup-gcloud.sh
#
# This is meant to be run interactively — if a step fails, `set -e` stops the
# script so you can see the error and re-run. There is no error trapping/retry
# logic on purpose; just fix the problem and re-run the script (each step is
# safe to re-run).
set -e

REPO_URL="${REPO_URL:-https://github.com/ynscancode/claudecode-sandbox.git}"
REPO_DIR="$HOME/claudecode-sandbox"

echo "==> Updating apt packages"
sudo apt-get update && sudo apt-get install -y build-essential curl git

echo "==> Installing Node.js 22 (NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v

echo "==> Installing PM2 globally"
sudo npm install -g pm2

echo "==> Cloning the repo (REPO_URL=$REPO_URL)"
if [ -d "$REPO_DIR" ]; then
  echo "    $REPO_DIR already exists, skipping clone"
else
  git clone "$REPO_URL" "$REPO_DIR"
fi

echo "==> Installing server dependencies (production only)"
cd "$REPO_DIR/server"
npm ci --omit=dev

echo "==> Creating /data for the SQLite DB (must exist before the app boots and"
echo "    runs its migration), owned by the current user (not a hardcoded"
echo "    'ubuntu' — the GCloud SSH username varies)"
sudo mkdir -p /data
sudo chown "$USER:$USER" /data

echo "==> Starting the app with PM2 (production env, from ecosystem.config.cjs)"
pm2 start ecosystem.config.cjs --env production

echo "==> Saving the PM2 process list"
pm2 save

echo "==> Setting up PM2 to start on boot"
echo "    pm2 startup will print a command like:"
echo "      sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u <your-user> --hp /home/<your-user>"
echo "    Copy that EXACT line it prints, run it, then re-run 'pm2 save'."
pm2 startup

echo "==> After copy-pasting/running the command pm2 startup printed above, run:"
echo "      pm2 save"
echo ""
echo "==> Setup complete."
echo "    The API should be reachable at http://<VM_IP>:4000/api/accounts"
echo "    (make sure your GCloud VPC firewall allows ingress on tcp:4000)"
echo "    Don't forget to set CORS_ORIGIN once you have your Vercel URL:"
echo "      pm2 set budget-api:CORS_ORIGIN https://your-app.vercel.app && pm2 restart budget-api"
