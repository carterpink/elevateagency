# Deploying Elevate Agency + the CMS

The site is an [Eleventy](https://www.11ty.dev/) static site. Content lives in
`src/_data/` (site + page copy) and `src/roster/` (one file per DJ). The client
edits it through **Sveltia CMS** at `/admin`, which commits to GitHub; **Cloudflare
Pages** rebuilds automatically.

## Local development
```bash
npm install
npm run dev      # http://localhost:8080  (live reload)
npm run build    # outputs to _site/
```

## One-time go-live (free tier)

### 1. Push to GitHub
```bash
git init && git add -A && git commit -m "Elevate Agency site + CMS"
# create a repo (github.com/new), then:
git remote add origin https://github.com/OWNER/REPO.git
git branch -M main && git push -u origin main
```

### 2. Cloudflare Pages (hosting + auto-deploy)
- Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
- Build command: `npx @11ty/eleventy`  ·  Output directory: `_site`
- Deploy. You'll get `https://<project>.pages.dev` (add a custom domain later).

### 3. GitHub OAuth app (so the client can log into /admin)
- GitHub → Settings → Developer settings → **OAuth Apps → New**.
- Homepage URL: your Pages URL. **Authorization callback URL:** `https://elevate-cms-auth.<you>.workers.dev/callback`
- Note the **Client ID** and generate a **Client secret**.

### 4. Deploy the auth worker
```bash
cd cms-auth
npx wrangler deploy
npx wrangler secret put GITHUB_CLIENT_ID       # paste Client ID
npx wrangler secret put GITHUB_CLIENT_SECRET   # paste Client secret
```
This prints the worker URL (e.g. `https://elevate-cms-auth.<you>.workers.dev`).

### 5. Fill the two TODOs in `admin/config.yml`
```yaml
backend:
  repo: OWNER/REPO
  base_url: https://elevate-cms-auth.<you>.workers.dev
```
Commit + push. Done — the client logs in at `https://<your-domain>/admin`.

## Notes
- `/admin` is unlinked from the public site and requires a GitHub login that is a
  collaborator on the repo. To give the client access, invite their GitHub user as a
  repo collaborator (Settings → Collaborators).
- Edits publish after the Pages rebuild (~1 min).
- DJ photos uploaded in the CMS are committed to `assets/img/roster/`. Ask the client
  to upload reasonably sized images (≤ ~1500px) to keep the repo lean.
