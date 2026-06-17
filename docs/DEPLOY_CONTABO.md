# Deploying Apico to a Contabo VPS (alongside an existing site)

This guide deploys Apico with Docker on a Contabo VPS that **already runs another
site** (e.g. a portfolio) on ports 80/443. Apico runs in containers bound to
`127.0.0.1` and is served on its own subdomain through the web server you already
have, so your existing site is never touched.

Topology:

```
Internet ──443──> Nginx (already on the VPS)
                    ├── yourdomain.com            ──> your existing portfolio (unchanged)
                    └── apico.yourdomain.com
                          ├── /                ──> 127.0.0.1:3000  (apico web container)
                          ├── /api/v1/...      ──> 127.0.0.1:5000  (apico api container)
                          └── /api-docs        ──> 127.0.0.1:5000  (swagger)
                                                     └── apico-mysql (internal only)
```

Replace `apico.yourdomain.com` with your real subdomain everywhere below.

---

## 1. Point a subdomain at the VPS

In your DNS provider, add an **A record**:

| Type | Name  | Value         |
|------|-------|---------------|
| A    | apico | `<VPS_IP>`    |

Wait for it to resolve before requesting a TLS cert:

```bash
dig +short apico.yourdomain.com   # should print your VPS IP
```

---

## 2. Check the VPS before changing anything

SSH in, then run this read-only diagnostic and keep the output:

```bash
# Which web server fronts your existing site?
sudo nginx -v 2>&1 || echo "no nginx"
sudo systemctl is-active nginx apache2 caddy 2>/dev/null

# Is Docker installed?
docker --version 2>/dev/null || echo "no docker"
docker compose version 2>/dev/null || echo "no compose plugin"

# Are the ports Apico wants (3000, 5000) free?
sudo ss -tlnp | grep -E ':(3000|5000)\s' || echo "3000 and 5000 are free"
```

- If something is already on **3000 or 5000**, pick other ports and set
  `WEB_PORT` / `API_PORT` in the `.env` (step 4). Update the Nginx config to match.
- This guide assumes **Nginx** fronts the existing site (the common case). If it's
  Caddy or Apache, the app/Docker steps are identical — only step 6 differs.

---

## 3. Install Docker (skip if already installed)

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER       # run docker without sudo
newgrp docker                       # apply the group in this shell
docker run --rm hello-world         # sanity check
```

The official script includes the `docker compose` v2 plugin.

---

## 4. Get the code and configure the environment

```bash
sudo mkdir -p /opt && sudo chown $USER:$USER /opt
cd /opt
git clone https://github.com/muhammadshehzaib/apico.git
cd apico

cp .env.docker .env
```

Edit `.env` (`nano .env`) and set **production** values:

```ini
# Strong, unique secrets — generate with:  openssl rand -base64 48
JWT_SECRET=<paste a long random string>
JWT_REFRESH_SECRET=<paste a different long random string>

MYSQL_ROOT_PASSWORD=<strong password>
MYSQL_PASSWORD=<strong password>

# Your real subdomain — note the /api/v1 path on the API url
NEXT_PUBLIC_API_URL=https://apico.yourdomain.com/api/v1
CORS_ORIGIN=https://apico.yourdomain.com
WEB_APP_URL=https://apico.yourdomain.com

# Only change if 3000/5000 were taken in step 2
WEB_PORT=3000
API_PORT=5000
```

Generate secrets quickly:

```bash
echo "JWT_SECRET=$(openssl rand -base64 48)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48)"
```

> `NEXT_PUBLIC_API_URL` is **baked into the web build**. If you ever change it,
> you must rebuild the web image (`docker compose up -d --build web`).

---

## 5. Build and start the containers

```bash
docker compose up -d --build
```

First build takes a few minutes. Then verify:

```bash
docker compose ps                  # all services "running"/"healthy"
docker compose logs -f api         # watch migrations run, then Ctrl-C

# Local smoke test (before the proxy is in place):
curl -s http://127.0.0.1:5000/api/v1/health    # API health
curl -sI http://127.0.0.1:3000                 # web responds
```

The API container runs `prisma migrate deploy` automatically on start, so the
schema is created on first boot.

---

## 6. Add the subdomain to Nginx + HTTPS

Create a new server block — this is a **separate file**, so your existing site's
config is untouched:

```bash
sudo nano /etc/nginx/sites-available/apico
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name apico.yourdomain.com;

    client_max_body_size 5m;   # apico proxies user requests; allow larger bodies

    # Express API (serves /api/v1/... and /api-docs)
    location /api/v1/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api-docs {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js web app (everything else)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }
}
```

Enable it and reload:

```bash
sudo ln -s /etc/nginx/sites-available/apico /etc/nginx/sites-enabled/apico
sudo nginx -t          # must say "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

Get a TLS certificate for just this subdomain (won't disturb other certs):

```bash
# If certbot isn't installed yet:
sudo apt update && sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d apico.yourdomain.com
```

Certbot rewrites this server block to listen on 443 and adds an 80→443 redirect.
Renewal is automatic (`systemctl list-timers | grep certbot`).

---

## 7. Verify end to end

- Open `https://apico.yourdomain.com` — the app loads over HTTPS.
- Register/log in — confirm requests succeed (DevTools → Network → calls go to
  `https://apico.yourdomain.com/api/v1/...` and return 2xx).
- `https://apico.yourdomain.com/api-docs` shows the Swagger UI.
- Your existing portfolio at `yourdomain.com` still works.

---

## 8. Day-2 operations

**Update to the latest code:**

```bash
cd /opt/apico
git pull
docker compose up -d --build
docker image prune -f          # reclaim old layers
```

**Logs / status:**

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f web
```

**Back up the database:**

```bash
docker compose exec mysql sh -c \
  'exec mysqldump -uapico -p"$MYSQL_PASSWORD" apico' > apico-backup-$(date +%F).sql
```

**Restore:**

```bash
cat apico-backup-YYYY-MM-DD.sql | docker compose exec -T mysql sh -c \
  'exec mysql -uapico -p"$MYSQL_PASSWORD" apico'
```

**Stop / start:**

```bash
docker compose down            # stop (data persists in the mysql_data volume)
docker compose up -d           # start again
```

---

## Notes & recommended follow-ups

- **Firewall:** only 22/80/443 need to be open. The app/DB ports are bound to
  `127.0.0.1`, so they're not reachable from the internet.
  ```bash
  sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- **`trust proxy`:** Apico runs behind Nginx, so Express should trust the proxy
  for correct client IPs (rate limiting) and `Secure` cookies over HTTPS. Add
  `app.set('trust proxy', 1);` near the top of `api/src/app.ts` (after
  `const app = express();`). Recommended, especially for the httpOnly-cookie auth.
- **Email invites:** workspace-invite emails are disabled until you fill the
  `SMTP_*` values in `.env` and `docker compose up -d` again.
- **Memory:** the MySQL + Node images comfortably fit a 4 GB Contabo VPS; on a
  smaller box add swap if builds get OOM-killed.
