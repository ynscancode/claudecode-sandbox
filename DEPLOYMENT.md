# Deployment

Deploys the budget tracker backend to a **Google Cloud Free Tier** VM (a real
Ubuntu 22.04 `e2-micro` instance, running 24/7 at no cost under the Always
Free tier, with a persistent boot disk for the SQLite DB) and the frontend to
Vercel.

## Prerequisites

- A free [Google Cloud](https://cloud.google.com) account (a credit card is
  required for identity verification, but Always Free resources are never
  charged — see the security/cost note in Part 1).
- A free [Vercel](https://vercel.com) account.
- The GitHub repo already exists: https://github.com/ynscancode/claudecode-sandbox

---

## Part 1 — Create a Google Cloud account

1. Go to [cloud.google.com](https://cloud.google.com) and sign up.
2. You'll be asked for a credit card during signup — this is for identity
   verification only. As long as you stay within the Always Free tier
   resources this guide uses (one `e2-micro` instance in an eligible region,
   30 GB standard persistent disk, the free egress allowance), you will not be
   charged.
3. Create a new project (Google Cloud groups all resources under a project —
   the console prompts you to create one on first login, or use the project
   picker at the top of the console).

---

## Part 2 — Create the VM

In the console:

1. **Compute Engine → VM instances → Create Instance**
2. **Name**: anything, e.g. `budget-api`.
3. **Region**: must be one of `us-west1`, `us-central1`, or `us-east1` — these
   are the only regions where the `e2-micro` Always Free allowance applies.
   Picking any other region will incur charges.
4. **Machine type**: under "General purpose" → **E2 series**, select
   **e2-micro**. This is the Always Free tier machine type.
5. **Boot disk**: click **Change**, select **Ubuntu 22.04 LTS**, and set the
   disk to **30 GB standard persistent disk** (also covered by the Always
   Free tier — don't switch to SSD, which isn't free).
6. **Firewall**: check both **Allow HTTP traffic** and **Allow HTTPS
   traffic** (these create the standard 80/443 rules; you'll open port 4000
   separately in Part 3).
7. Click **Create**.
8. Once the instance is running, note its **External IP** shown on the VM
   instances list/detail page — you'll use it throughout the rest of this
   guide as `<YOUR_VM_IP>`.

---

## Part 3 — Open port 4000

The app listens on port 4000, which isn't open by default.

1. **VPC Network → Firewall → Create Firewall Rule**
2. **Name**: `allow-budget-api`
3. **Targets**: All instances in the network
4. **Source IP ranges**: `0.0.0.0/0`
5. **Protocols and ports**: check **TCP**, enter `4000`
6. Click **Create**.

---

## Part 4 — SSH in and run the setup script

Two ways to get a shell on the VM — no SSH key file to manage either way:

- **Option A (browser, easiest)**: on the VM instances page, click the **SSH**
  button next to your instance. This opens a browser-based terminal directly
  to the VM.
- **Option B (local terminal, if you have the `gcloud` CLI installed)**:
  ```
  gcloud compute ssh budget-api --zone=<YOUR_ZONE>
  ```
  (`<YOUR_ZONE>` is the specific zone within your region, e.g. `us-central1-a`
  — shown on the VM's detail page.)

Once you have a shell, run the setup script directly from GitHub:

```
curl -fsSL https://raw.githubusercontent.com/ynscancode/claudecode-sandbox/main/server/scripts/setup-gcloud.sh | bash
```

`server/scripts/setup-gcloud.sh` is linear and fail-fast (`set -e`, no error
trapping) — it's meant to be run interactively; if a step fails, read the
error, fix it, and re-run (every step is safe to re-run). It installs
`build-essential`/`git`/`curl` (`build-essential` is required because
`better-sqlite3` compiles a native addon), installs Node.js 22 via
NodeSource, installs PM2 globally, clones the repo to
`~/claudecode-sandbox` (override with `REPO_URL=... bash` if deploying a
fork), runs `npm ci --omit=dev` in `server/`, creates `/data` owned by
whichever user you're SSHed in as (the script doesn't hardcode `ubuntu` —
GCloud's default SSH username varies), and starts the app via
`pm2 start ecosystem.config.cjs --env production` (`budget-api` on port 4000,
SQLite DB at `/data/budget.db`, per `ecosystem.config.cjs`).

**One manual step in the middle of the script**: `pm2 startup` prints a
`sudo env PATH=... pm2 startup systemd -u <your-user> --hp /home/<your-user>`
command that you must copy, paste, and run yourself (PM2 can't do this
unattended), then run `pm2 save` again afterward. The script's echoes call
this out when you get there.

---

## Part 5 — Test

```
curl http://<YOUR_VM_IP>:4000/api/accounts
```

should return a JSON array with the Spending and Savings accounts, e.g.
`[{"id":1,"name":"Spending","balance":0},{"id":2,"name":"Savings","balance":0}]`.

If this times out, double-check the firewall rule from Part 3 (name, target,
port) and that PM2 shows the process running (`pm2 status` on the VM).

---

## Part 6 — Connect the Vercel frontend

1. In the Vercel dashboard: **Add New Project** → import the
   `ynscancode/claudecode-sandbox` GitHub repo.
2. Project settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment variable (**Project → Settings → Environment Variables**):
   - `VITE_API_URL` = `http://<YOUR_VM_IP>:4000` (no trailing slash)

   This is a **build-time** variable — Vite inlines it when the app is built,
   not at runtime. If you change it later, you must trigger a new deploy
   (push a commit, or use **Redeploy** in the dashboard) for the change to
   take effect.
4. Deploy (or push a commit to trigger the first auto-deploy).
5. Open the Vercel URL on your phone and test — including over plain HTTP,
   see the security note below on why this is fine for personal use but worth
   being aware of.

---

## Part 7 — Set CORS

Once you have your Vercel URL, SSH back into the VM (Part 4) and run:

```
pm2 set budget-api:CORS_ORIGIN https://your-app.vercel.app
pm2 restart budget-api
```

Comma-separate multiple origins if needed (e.g. a preview URL plus the
production URL):

```
pm2 set budget-api:CORS_ORIGIN https://your-app.vercel.app,https://your-app-git-preview.vercel.app
pm2 restart budget-api
```

**Optional — LLM-assisted import ("Suggest with AI")**: off by default. Only
set these if you want that feature in production. `ecosystem.config.cjs`
doesn't define them, so set them the same way as `CORS_ORIGIN`:

```
pm2 set budget-api:OLLAMA_CLOUD_API_KEY ...
pm2 set budget-api:OLLAMA_CLOUD_MODEL ...
pm2 set budget-api:OLLAMA_CLOUD_BASE_URL ...
pm2 restart budget-api
```

---

## Part 8 — Updating the app in the future

SSH into the VM (the browser SSH button, or `gcloud compute ssh budget-api
--zone=<YOUR_ZONE>` — same two options as Part 4), then:

```
cd ~/claudecode-sandbox/server
git pull
npm ci --omit=dev
pm2 restart budget-api
```

The frontend redeploys automatically on every push to the connected
branch — no manual step needed there.

---

## Part 9 — Backup your data

The SQLite DB lives at `/data/budget.db` on the VM's persistent boot disk
(per `DB_PATH` in `ecosystem.config.cjs`) — it survives app restarts, `git
pull` + redeploys, and VM reboots (as long as you don't terminate/recreate
the VM instance itself). There is no automated backup configured. To take a
manual backup, copy the file to your local machine using `gcloud`:

```
gcloud compute scp budget-api:/data/budget.db ./budget-backup.db --zone=<YOUR_ZONE>
```

Run this periodically if you want a local backup — nothing in this
deployment does it for you automatically.

---

## Security — no authentication

**This app has no login or authentication of any kind.** This was an accepted
tradeoff for a single-user personal tool, not an oversight — but it matters
once the app is reachable on a public URL:

- Anyone who knows (or guesses/finds) your VM's IP and port 4000 can read and
  write your transaction data directly via the API — there is nothing
  checking who's asking.
- `CORS_ORIGIN` only restricts which **browser origins** (web pages) are
  allowed to make cross-origin requests to the backend from JavaScript. It
  does **not** block direct requests — `curl`, Postman, a script, or any
  non-browser client can hit the API regardless of `CORS_ORIGIN`. Treat
  `CORS_ORIGIN` as a hygiene measure against casual/accidental cross-site
  requests, not as an access-control mechanism.
- Set `CORS_ORIGIN` anyway (Part 7) — it's still worth doing — but understand
  it does not make the deployment private. Don't rely on "nobody knows the
  IP" (security through obscurity) as your actual protection; be aware that
  an open port on a public IP is genuinely public, and the API is served over
  plain HTTP (no TLS) unless you add a reverse proxy/certificate yourself —
  treat traffic to it as unencrypted.
- If this exposure is unacceptable, don't deploy publicly — run the app
  locally instead (per the main `README.md`/`CLAUDE.md` setup), or add
  authentication (and TLS) before exposing it, which is out of scope for this
  deployment guide.
