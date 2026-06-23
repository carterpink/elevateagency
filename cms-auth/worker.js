/**
 * Elevate CMS — GitHub OAuth worker for Sveltia / Decap CMS.
 * Deploy on Cloudflare Workers (free). It lets the client log into
 * /admin with GitHub without exposing any secrets to the browser.
 *
 * Setup (see DEPLOY.md):
 *   1. Create a GitHub OAuth App. Authorization callback URL:
 *        https://<this-worker>.workers.dev/callback
 *   2. wrangler secret put GITHUB_CLIENT_ID
 *      wrangler secret put GITHUB_CLIENT_SECRET
 *   3. Put this worker's URL into admin/config.yml -> backend.base_url
 */
const GH_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GH_TOKEN = "https://github.com/login/oauth/access_token";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams, origin } = url;

    if (pathname === "/") {
      return new Response("Elevate CMS auth worker is running.", { status: 200 });
    }

    // Step 1 — kick off the OAuth flow
    if (pathname === "/auth") {
      const state = crypto.randomUUID();
      const authUrl = new URL(GH_AUTHORIZE);
      authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", `${origin}/callback`);
      authUrl.searchParams.set("scope", searchParams.get("scope") || "repo,user");
      authUrl.searchParams.set("state", state);
      return new Response(null, {
        status: 302,
        headers: {
          Location: authUrl.toString(),
          "Set-Cookie": `csrf=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        },
      });
    }

    // Step 2 — GitHub redirects back here with a code
    if (pathname === "/callback") {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const cookie = request.headers.get("Cookie") || "";
      const saved = (cookie.match(/csrf=([^;]+)/) || [])[1];

      if (!code || !state || state !== saved) {
        return new Response("Invalid OAuth state.", { status: 400 });
      }

      const tokenRes = await fetch(GH_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${origin}/callback`,
        }),
      });
      const data = await tokenRes.json();
      const token = data.access_token;
      const status = token ? "success" : "error";
      const payload = token
        ? JSON.stringify({ token, provider: "github" })
        : JSON.stringify({ error: data.error_description || data.error || "no token" });
      const message = `authorization:github:${status}:${payload}`;

      const html = `<!doctype html><html><body><script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage(${JSON.stringify(message)}, e.origin);
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
</script>Signing you in…</body></html>`;

      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("Not found", { status: 404 });
  },
};
